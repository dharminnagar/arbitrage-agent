"use client";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useConnection, useActiveAddress } from "arweave-wallet-kit";
import { toast } from "sonner";
import { Tokens } from "@/lib/config";
import { dryrunResult, messageResult, spawnProcess } from "@/lib/aoService";
import { ArrowRight, ChartBarIcon, HelpCircle, Info, Loader2, Play, Settings, StopCircle } from "lucide-react";
import { ArbitrageDetailsDialog } from "../ui/arbitrage-details-dialog";

// The Arbitrage Agent Process ID
// TODO: This should be moved to a config file
const ARBITRAGE_AGENT_PID = "kwNZEi7nWEi0ckEkEHYwYNzO6TT7yhZ_EO8xxLMVoCg";

const WINSTON_TO_AR = 1e12;

const formatWinstonToAR = (winston: string | number) => {
    const num = typeof winston === 'string' ? parseFloat(winston) : winston;
    return (num / WINSTON_TO_AR).toFixed(6);
};

export const ArbitragePage = () => {
    const { connected } = useConnection();
    const address = useActiveAddress();
    const [maxAllowance, setMaxAllowance] = useState(0);
    const [selectedInputToken, setSelectedInputToken] = useState(Tokens.STAR1.address);
    const [selectedTargetToken, setSelectedTargetToken] = useState(Tokens.STAR2.address);
    const [slippageTolerance, setSlippageTolerance] = useState("0.3");
    const [isLoading, setIsLoading] = useState(false);
    const [botRunning, setBotRunning] = useState(false);
    const [stopLoading, setStopLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [arbitrageDetails, setArbitrageDetails] = useState<string[]>([]);
    const [arbitrageData, setArbitrageData] = useState<any>(null);
    const [lastOpportunity, setLastOpportunity] = useState<any>(null);
    const [userProcessId, setUserProcessId] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [statusLoading, setStatusLoading] = useState(false);
    const [profitDisplay, setProfitDisplay] = useState<string>("0.000000");

    useEffect(() => {
        if (!connected) {
            toast("DeltaFi requires your wallet to continue");
        } else {
            toast("Your wallet is connected successfully!");
        }
    }, [connected]);

    // Initialize and check status on component mount
    useEffect(() => {
        const initializeArbitrage = async () => {
            setStatusLoading(true);
            toast("Fetching arbitrage data...");
            if (!connected || !address) {
                setIsInitializing(false);
                setStatusLoading(false);
                return;
            }

            try {
                // Use hardcoded process ID for user's process
                const processId = "cO9aWJFex1k3SeL_2SyAwrvTLVzhm-ty7GJmrt56OKg";
                setUserProcessId(processId);

                // Check if bot is running
                const statusRes = await dryrunResult(ARBITRAGE_AGENT_PID, [
                    { name: "Action", value: "Status" },
                ]);
                
                console.log("Status Response:", statusRes);

                // Handle the response format correctly
                if (statusRes && statusRes.Tags) {
                    const enabled = statusRes.Tags.find((tag: { name: string; }) => tag.name === "Enabled")?.value === true;
                    console.log("Bot running status:", enabled);
                    setBotRunning(enabled);
                    
                    if (enabled) {
                        console.log("Bot is running");
                        try {
                            // Extract values from tags
                            const tags = statusRes.Tags.reduce((acc: { [x: string]: any; }, tag: { name: string | number; value: any; }) => {
                                acc[tag.name] = tag.value;
                                return acc;
                            }, {});
                            
                            // Format data for display
                            const inputTokenSymbol = getTokenSymbol(tags.InputToken);
                            const targetTokenSymbol = getTokenSymbol(tags.TargetToken);
                            
                            const details = [
                                `Status: ${enabled ? "Running" : "Stopped"}`,
                                `Input Token: ${inputTokenSymbol} (${tags.InputToken})`,
                                `Target Token: ${targetTokenSymbol} (${tags.TargetToken})`,
                                `Agent is still finding opportunities for you`,
                            ];
                            
                            setArbitrageData(details);
                        } catch (parseError) {
                            console.error("Error parsing status data:", parseError);
                            toast.error("Failed to parse status data");
                        }
                    }
                } else {
                    console.log("Bot status not available");
                    setBotRunning(false);
                }
            } catch (error) {
                console.error("Error initializing arbitrage:", error);
                toast.error("Failed to initialize arbitrage process");
            } finally {
                setIsInitializing(false);
                setStatusLoading(false);
            }
        };

        initializeArbitrage();
    }, [connected, address, selectedInputToken, selectedTargetToken]);

    // Modified poll for arbitrage data when bot is running
    // Now includes check for dialog open state
    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        const fetchArbitrageData = async () => {
            // Don't fetch if not connected, no address, bot not running, or details dialog is open
            if (!connected || !address || !botRunning || showDetails) return;
            
            try {
                const res = await dryrunResult(ARBITRAGE_AGENT_PID, [
                    { name: "Action", value: "GetArbitrageData" },
                ]);

                console.log("Arbitrage Data Response:", res);
                
                if (res && res.Data) {
                    let data;
                    try {
                        data = JSON.parse(res.Data);
                        console.log("Parsed Arbitrage Data:", data);
                    } catch (error) {
                        console.error("Error parsing response data:", error);
                        return;
                    }
                    
                    // Initialize details array with basic information
                    let details = [
                        `Status: ${data.status || "Running"}`,
                        `Input Token: ${getTokenSymbol(data.inputToken)}`,
                        `Target Token: ${getTokenSymbol(data.targetToken)}`
                    ];
                    
                    // Add balance and profit information if available
                    if (data.balance) {
                        details.push(`Current Balance: ${formatWinstonToAR(data.balance)} ${getTokenSymbol(data.inputToken)}`);
                    }
                    
                    if (data.totalProfit) {
                        details.push(`Total Profit: ${formatWinstonToAR(data.totalProfit)} ${getTokenSymbol(data.inputToken)}`);
                        setProfitDisplay(formatWinstonToAR(data.totalProfit));
                    }
                    
                    // Add configuration information if available
                    if (data.slippage) {
                        details.push(`Slippage: ${formatWinstonToAR(data.slippage)}%`);
                    }
                    
                    if (data.minProfitThreshold) {
                        details.push(`Min Profit Threshold: ${formatWinstonToAR(data.minProfitThreshold)}%`);
                    }
                    
                    if (data.dexCount) {
                        details.push(`DEX Count: ${data.dexCount}`);
                    }
                    
                    // Handle lastOpportunity data
                    if (data.lastOpportunity) {
                        const lo = data.lastOpportunity;
                        details.push(
                            `Last Opportunity at: ${new Date(lo.timestamp * 1000).toLocaleString()}`,
                            `Input Amount: ${formatWinstonToAR(lo.inputAmount)} ${getTokenSymbol(data.inputToken)}`,
                            `Output Amount: ${formatWinstonToAR(lo.outputAmount)} ${getTokenSymbol(data.inputToken)}`,
                            `Profit: ${formatWinstonToAR(lo.profit)} ${getTokenSymbol(data.inputToken)}`
                        );
                        
                        // If we have DEX information, add it
                        if (lo.buyDex && lo.sellDex) {
                            details.push(`Buy DEX: ${lo.buyDex.substring(0, 8)}...`, `Sell DEX: ${lo.sellDex.substring(0, 8)}...`);
                        }
                        
                        // Notify only if this is a new opportunity
                        if (!lastOpportunity || lo.timestamp > lastOpportunity.timestamp) {
                            setLastOpportunity(lo);
                            toast.success("New arbitrage opportunity found!");
                        }
                    } else {
                        // No last opportunity available
                        details.push("Agent is still finding opportunities for you");
                    }
                    
                    // Add DEX prices information if available
                    if (data.dexPrices && Object.keys(data.dexPrices).length > 0) {
                        details.push("DEX Prices:");
                        Object.entries(data.dexPrices).forEach(([dexId, priceInfo]: [string, any], index) => {
                            details.push(`  Dex${index + 1}: ${priceInfo.price}`);
                        });
                    }
                    
                    setArbitrageData(details);
                }
            } catch (error) {
                console.error("Error fetching arbitrage data:", error);
            }
        };

        if (botRunning && !showDetails) {
            fetchArbitrageData();
            interval = setInterval(fetchArbitrageData, 5000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [connected, address, botRunning, lastOpportunity, showDetails]);

    const getTokenSymbol = (address: string) => {
        const token = Object.values(Tokens).find(t => t.address === address);
        return token?.symbol || "AR";
    };

    async function handleStartArbitrage() {
        if (!connected || !address) {
            toast.error("Please connect your wallet first");
            return;
        }

        if (!userProcessId) {
            toast.error("User process ID not initialized");
            return;
        }

        if (maxAllowance <= 0) {
            toast.error("Please enter a valid allowance amount");
            return;
        }

        if (selectedInputToken === selectedTargetToken) {
            toast.error("Input and target tokens must be different");
            return;
        }

        setIsLoading(true);
        setMaxAllowance(maxAllowance * 1e12);
        console.log(maxAllowance);
        try {
            // Step 1: Setup the arbitrage agent with user inputs
            const setupRes = await messageResult(ARBITRAGE_AGENT_PID, [
                { name: "Action", value: "Setup" },
                { name: "InputToken", value: selectedInputToken },
                { name: "TargetToken", value: selectedTargetToken },
                { name: "Slippage", value: slippageTolerance },
                { name: "InputTokenAmount", value: maxAllowance.toString() },
                { name: "OriginalSender", value: userProcessId },
                { name: "MinProfitThreshold", value: "100000000000" },  // Example threshold
            ]);

            if (setupRes.Error) {
                throw new Error("Setup failed: " + setupRes.Error);
            }

            const startArbitrageRes = await messageResult(ARBITRAGE_AGENT_PID, [
                { name: "Action", value: "Start" },
                { name: "inputToken", value: selectedInputToken },
                { name: "targetToken", value: selectedTargetToken },
            ])

            if(startArbitrageRes.Error) {
                throw new Error("Failed to start arbitrage: " + startArbitrageRes.Error);
            }
            console.log("Setup Response:", setupRes);
            console.log("Start Arbitrage Response:", startArbitrageRes);
            
            
            // Step 2: Add DEX processes (assuming they're already configured in the agent)
            // This step would be here if DEXes needed to be manually added
            
            // Step 3: Start the arbitrage bot
            const startRes = await messageResult(userProcessId, [
                { name: "Action", value: "Start" },
                { name: "Target", value: ARBITRAGE_AGENT_PID }  // Specify the target agent process
            ]);
            
            toast.success("Arbitrage bot setup complete!");
            
            if (startRes.Error) {
                throw new Error("Failed to start bot: " + startRes.Error);
            }
            
            toast.success("Arbitrage bot started successfully!");
            setBotRunning(true);
            
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "An error occurred while starting the arbitrage bot");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleStopArbitrage() {
        if (!connected || !address) {
            toast.error("Please connect your wallet first");
            return;
        }

        if (!userProcessId) {
            toast.error("User process ID not initialized");
            return;
        }

        setStopLoading(true);
        try {
            const res = await messageResult(ARBITRAGE_AGENT_PID, [
                { name: "Action", value: "Stop" },
            ]);

            if (res.Error) {
                throw new Error("Failed to stop bot: " + res.Error);
            }
            
            toast.success("Arbitrage bot stopped successfully");
            setBotRunning(false);
            
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "An error occurred while stopping the arbitrage bot");
        } finally {
            setStopLoading(false);
        }
    }

    // Also add a handler to fetch fresh data when the dialog is closed
    const handleCloseDetailsDialog = () => {
        setShowDetails(false);
        
        // Immediately fetch fresh data when closing the dialog
        if (connected && address && botRunning) {
            const fetchData = async () => {
                try {
                    const res = await dryrunResult(ARBITRAGE_AGENT_PID, [
                        { name: "Action", value: "GetArbitrageData" },
                    ]);
                    
                    // Process the response (reusing the same logic)
                    if (res && res.Data) {
                        let data;
                        try {
                            data = JSON.parse(res.Data);
                        } catch (error) {
                            console.error("Error parsing response data:", error);
                            return;
                        }
                        
                        // Build details array (same logic as in fetchArbitrageData)
                        let details = [
                            `Status: ${data.status || "Running"}`,
                            `Input Token: ${getTokenSymbol(data.inputToken)}`,
                            `Target Token: ${getTokenSymbol(data.targetToken)}`
                        ];
                        
                        // Add balance and profit information if available
                        if (data.balance) {
                            details.push(`Current Balance: ${formatWinstonToAR(data.balance)} ${getTokenSymbol(data.inputToken)}`);
                        }
                        
                        if (data.totalProfit) {
                            details.push(`Total Profit: ${formatWinstonToAR(data.totalProfit)} ${getTokenSymbol(data.inputToken)}`);
                            setProfitDisplay(formatWinstonToAR(data.totalProfit));
                        }
                        
                        // Add configuration information if available
                        if (data.slippage) {
                            details.push(`Slippage: ${formatWinstonToAR(data.slippage)}%`);
                        }
                        
                        if (data.minProfitThreshold) {
                            details.push(`Min Profit Threshold: ${formatWinstonToAR(data.minProfitThreshold)}%`);
                        }
                        
                        if (data.dexCount) {
                            details.push(`DEX Count: ${data.dexCount}`);
                        }
                        
                        // Handle lastOpportunity data
                        if (data.lastOpportunity) {
                            const lo = data.lastOpportunity;
                            details.push(
                                `Last Opportunity at: ${new Date(lo.timestamp * 1000).toLocaleString()}`,
                                `Input Amount: ${formatWinstonToAR(lo.inputAmount)} ${getTokenSymbol(data.inputToken)}`,
                                `Output Amount: ${formatWinstonToAR(lo.outputAmount)} ${getTokenSymbol(data.inputToken)}`,
                                `Profit: ${formatWinstonToAR(lo.profit)} ${getTokenSymbol(data.inputToken)}`
                            );
                            
                            // If we have DEX information, add it
                            if (lo.buyDex && lo.sellDex) {
                                details.push(`Buy DEX: ${lo.buyDex.substring(0, 8)}...`, `Sell DEX: ${lo.sellDex.substring(0, 8)}...`);
                            }
                            
                            // Notify only if this is a new opportunity
                            if (!lastOpportunity || lo.timestamp > lastOpportunity.timestamp) {
                                setLastOpportunity(lo);
                                toast.success("New arbitrage opportunity found!");
                            }
                        } else {
                            // No last opportunity available
                            details.push("Agent is still finding opportunities for you");
                        }
                        
                        // Add DEX prices information if available
                        if (data.dexPrices && Object.keys(data.dexPrices).length > 0) {
                            details.push("DEX Prices:");
                            Object.entries(data.dexPrices).forEach(([dexId, priceInfo]: [string, any]) => {
                                details.push(`  ${dexId.substring(0, 8)}...: ${priceInfo.price}`);
                            });
                        }
                        
                        setArbitrageData(details);
                    }
                } catch (error) {
                    console.error("Error fetching data after dialog close:", error);
                }
            };
            
            fetchData();
        }
    };

    const getTokenColor = (symbol: string) => {
        if (symbol === "STAR1") return "bg-blue-500";
        if (symbol === "STAR2") return "bg-purple-500";
        return "bg-gray-500";
    };

    const getTokenIcon = (symbol: string) => {
        if (symbol === "STAR1") return "$";
        if (symbol === "STAR2") return "A";
        return "T";
    };

    return (
        <div className="flex flex-col items-center justify-center w-full py-16 px-8">
            <Card className="w-full max-w-6xl rounded-xl bg-white border border-neutral-200 shadow-lg overflow-hidden">
                <CardContent className="p-8">
                    <div className="flex flex-col space-y-6">
                        {/* Header with title and profit display */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-full p-3 shadow-md">
                                    <ChartBarIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-3xl font-bold text-gray-800">DeltaFi</CardTitle>
                                    <CardDescription className="text-lg text-gray-500">
                                        Automated Cross-DEX Arbitrage Bot
                                    </CardDescription>
                                </div>
                            </div>

                            {botRunning && (
                                <div className="bg-green-50 border border-green-100 rounded-xl p-3 shadow-sm">
                                    <div className="text-sm font-medium text-gray-500">Profit</div>
                                    <div className="text-xl font-bold text-green-600 flex items-center gap-1">
                                        +{profitDisplay} <span className="text-sm font-normal">{getTokenSymbol(selectedInputToken)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Separator className="bg-gray-200" />

                        {botRunning ? (
                            <div className="space-y-6 py-2">
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="flex items-center gap-2 font-semibold text-green-700">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                            Bot Running
                                        </h3>
                                        <Button
                                            variant="outline" 
                                            className="text-sm flex items-center gap-2 border-gray-300"
                                            onClick={() => setShowDetails(true)}
                                        >
                                            <Settings className="w-4 h-4" />
                                            View Details
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 mt-4">
                                        <div>
                                            <div className="text-sm text-gray-600">Input Token</div>
                                            <div className="font-medium flex items-center gap-2 mt-1">
                                                <div className={`w-4 h-4 rounded-full ${getTokenColor(getTokenSymbol(selectedInputToken))} flex items-center justify-center`}>
                                                    <span className="text-white text-xs font-bold">
                                                        {getTokenIcon(getTokenSymbol(selectedInputToken))}
                                                    </span>
                                                </div>
                                                {getTokenSymbol(selectedInputToken)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Target Token</div>
                                            <div className="font-medium flex items-center gap-2 mt-1">
                                                <div className={`w-4 h-4 rounded-full ${getTokenColor(getTokenSymbol(selectedTargetToken))} flex items-center justify-center`}>
                                                    <span className="text-white text-xs font-bold">
                                                        {getTokenIcon(getTokenSymbol(selectedTargetToken))}
                                                    </span>
                                                </div>
                                                {getTokenSymbol(selectedTargetToken)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Slippage Tolerance</div>
                                            <div className="font-medium mt-1">{slippageTolerance}%</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Max Allowance</div>
                                            <div className="font-medium mt-1">{formatWinstonToAR(maxAllowance)} {getTokenSymbol(selectedInputToken)}</div>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-12 text-base bg-red-500 hover:bg-red-600 text-white transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                    onClick={handleStopArbitrage}
                                    disabled={stopLoading || !connected}
                                >
                                    {stopLoading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Stopping Bot...</span>
                                        </>
                                    ) : (
                                        <>
                                            <StopCircle className="h-5 w-5" />
                                            <span>Stop Arbitrage Bot</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6 py-2">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                                            Input Token
                                            <div className="tooltip-wrapper" title="This is the token you will use for trading">
                                                <HelpCircle className="w-3 h-3 text-gray-400" />
                                            </div>
                                        </label>
                                        <Select 
                                            value={selectedInputToken} 
                                            onValueChange={setSelectedInputToken}
                                            disabled={botRunning || isLoading}
                                        >
                                            <SelectTrigger className="w-full bg-white">
                                                <SelectValue placeholder="Select Input Token">
                                                    {selectedInputToken && (
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-5 h-5 rounded-full ${getTokenColor(getTokenSymbol(selectedInputToken))} flex items-center justify-center`}>
                                                                <span className="text-white font-bold text-xs">
                                                                    {getTokenIcon(getTokenSymbol(selectedInputToken))}
                                                                </span>
                                                            </div>
                                                            {getTokenSymbol(selectedInputToken)}
                                                        </div>
                                                    )}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.values(Tokens).map((token) => (
                                                    <SelectItem key={token.address} value={token.address}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-5 h-5 rounded-full ${getTokenColor(token.symbol)} flex items-center justify-center`}>
                                                                <span className="text-white font-bold text-xs">
                                                                    {getTokenIcon(token.symbol)}
                                                                </span>
                                                            </div>
                                                            {token.symbol}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                                            Target Token
                                            <div className="tooltip-wrapper" title="This is the token you will trade against">
                                                <HelpCircle className="w-3 h-3 text-gray-400" />
                                            </div>
                                        </label>
                                        <Select 
                                            value={selectedTargetToken} 
                                            onValueChange={setSelectedTargetToken}
                                            disabled={botRunning || isLoading}
                                        >
                                            <SelectTrigger className="w-full bg-white">
                                                <SelectValue placeholder="Select Target Token">
                                                    {selectedTargetToken && (
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-5 h-5 rounded-full ${getTokenColor(getTokenSymbol(selectedTargetToken))} flex items-center justify-center`}>
                                                                <span className="text-white font-bold text-xs">
                                                                    {getTokenIcon(getTokenSymbol(selectedTargetToken))}
                                                                </span>
                                                            </div>
                                                            {getTokenSymbol(selectedTargetToken)}
                                                        </div>
                                                    )}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.values(Tokens).map((token) => (
                                                    <SelectItem key={token.address} value={token.address}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-5 h-5 rounded-full ${getTokenColor(token.symbol)} flex items-center justify-center`}>
                                                                <span className="text-white font-bold text-xs">
                                                                    {getTokenIcon(token.symbol)}
                                                                </span>
                                                            </div>
                                                            {token.symbol}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                                        Maximum Allowance
                                        <div className="tooltip-wrapper" title="Maximum amount of token to use for arbitrage">
                                            <HelpCircle className="w-3 h-3 text-gray-400" />
                                        </div>
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder="Enter maximum allowance amount"
                                        className="w-full text-base h-10 border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-md"
                                        value={maxAllowance || ""}
                                        onChange={(e) => setMaxAllowance(parseFloat(e.target.value) || 0)}
                                        disabled={botRunning || isLoading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                                        Slippage Tolerance
                                        <div className="tooltip-wrapper" title="Maximum price movement allowed during trades">
                                            <HelpCircle className="w-3 h-3 text-gray-400" />
                                        </div>
                                    </label>
                                    <Select 
                                        value={slippageTolerance} 
                                        onValueChange={setSlippageTolerance}
                                        disabled={botRunning || isLoading}
                                    >
                                        <SelectTrigger className="w-full bg-white">
                                            <SelectValue placeholder="Select slippage tolerance" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0.1">0.1%</SelectItem>
                                            <SelectItem value="0.3">0.3%</SelectItem>
                                            <SelectItem value="0.5">0.5%</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="pt-2">
                                    {isInitializing || statusLoading ? (
                                        <Button
                                            className="w-full h-12 text-base bg-gray-400 cursor-not-allowed text-white flex items-center justify-center gap-2"
                                            disabled
                                        >
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            {isInitializing ? "Initializing..." : "Checking Status..."}
                                        </Button>
                                    ) : (
                                        <Button
                                            className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                            onClick={handleStartArbitrage}
                                            disabled={isLoading || !connected || maxAllowance <= 0 || selectedInputToken === selectedTargetToken}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    <span>Starting Bot...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="h-5 w-5" />
                                                    <span>Start Arbitrage Bot</span>
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>

                                <div className="text-xs text-center text-gray-500 flex items-center justify-center gap-2 italic">
                                    <Info className="w-3 h-3" />
                                    <div>The bot will automatically search for the most profitable opportunities across all DEXes</div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            
            <ArbitrageDetailsDialog
                isOpen={showDetails}
                onClose={handleCloseDetailsDialog}
                details={arbitrageData}
            />
        </div>
    );
};

export default ArbitragePage;