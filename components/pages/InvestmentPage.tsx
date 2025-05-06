"use client";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Calendar, Loader2, Repeat } from "lucide-react";
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
import { mainProcessId, Tokens } from "@/lib/config";
import { dryrunResult, messageResult } from "@/lib/aoService";

export const InvestmentPage = () => {
    const { connected } = useConnection();
    const address = useActiveAddress();
    const [amount, setAmount] = useState(0);
    const [inputToken, setInputToken] = useState("STAR1");
    const [outputToken, setOutputToken] = useState("STAR2");
    const [userPid, setUserPid] = useState<string | undefined>(undefined);
    const [cronDate, setCronDate] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!connected) {
            toast("DeltaFi requires your wallet to continue");
        } else {
            toast("Your wallet is connected successfully!");
        }
    }, [connected]);

    useEffect(() => {
        const fetchProcessId = async () => {
            const res = await dryrunResult(mainProcessId, [
                { name: "Action", value: "getUser" },
                { name: "Wallet_Address", value: address! },
            ]);
            setUserPid(res[0].Process_ID);
        };

        if (address) {
            fetchProcessId();
        }
    }, [address]);

    async function handleConfirm() {
        if (!connected || !userPid) {
            toast.error("Please ensure your wallet is connected");
            return;
        }

        if (amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (inputToken === outputToken) {
            toast.error("Input and output tokens must be different");
            return;
        }

        setIsLoading(true);
        toast("Processing your investment. This may take a moment...");

        try {
            const res = await messageResult(mainProcessId, [
                { name: "Action", value: "SetupInvestment" },
                { name: "Wallet_Address", value: address! },
                { name: "InputTokenAddress", value: inputToken },
                { name: "OutputTokenAddress", value: outputToken },
                { name: "Amount", value: amount.toString() },
                { name: "InputTokenDecimal", value: "12" },
                { name: "OutputTokenDecimal", value: "12" },
                { name: "PERSON_PID", value: userPid! },
                { name: "RecurringDay", value: cronDate.toString() },
            ]);

            toast("Almost there. Finalizing your investment...");

            console.log("Response from aoService:", res);

            if (res.Messages[0]?.Tags.Result === "success") {
                toast.success(res.Messages[0]?.Data || "Investment created successfully!");
            } else {
                toast.success("Investment setup successfully!");
            }
        } catch (error) {
            console.error("Error during investment setup:", error);
            toast.error("An error occurred while processing your investment");
        } finally {
            setIsLoading(false);
        }
    }

    const getTokenSymbol = (address: string) => {
        return Object.values(Tokens).find(token => token.address === address)?.symbol || "Unknown";
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
                <CardContent className="p-8 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-full p-3 shadow-md">
                            <Repeat className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-bold text-gray-800">Set Up Recurring Investment</CardTitle>
                            <CardDescription className="text-lg text-gray-500">
                                {amount > 0 ? (
                                    <>Allocating <span className="font-medium">{amount} {getTokenSymbol(inputToken)}</span> to automated trading</>
                                ) : (
                                    <>Configure your recurring investment strategy</>
                                )}
                            </CardDescription>
                        </div>
                    </div>

                    <Separator className="bg-gray-200" />

                    <div className="space-y-6 max-w-xl mx-auto">
                        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <h3 className="font-medium text-gray-700">Swap Configuration</h3>
                            
                            <div className="flex justify-between items-center gap-4">
                                <div className="space-y-2 flex-1">
                                    <label className="text-sm font-medium text-gray-600">From</label>
                                    <Select value={inputToken} onValueChange={setInputToken}>
                                        <SelectTrigger className="w-full bg-white">
                                            <SelectValue placeholder="Select Token">
                                                {inputToken && (
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-full ${getTokenColor(getTokenSymbol(inputToken))} flex items-center justify-center`}>
                                                            <span className="text-white font-bold text-sm">
                                                                {getTokenIcon(getTokenSymbol(inputToken))}
                                                            </span>
                                                        </div>
                                                        {getTokenSymbol(inputToken)}
                                                    </div>
                                                )}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(Tokens).map((token) => (
                                                <SelectItem key={token.address} value={token.address}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-full ${getTokenColor(token.symbol)} flex items-center justify-center`}>
                                                            <span className="text-white font-bold text-sm">
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

                                <div className="p-2">
                                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                                        <ArrowRight className="w-5 h-5 text-gray-600" />
                                    </div>
                                </div>

                                <div className="space-y-2 flex-1">
                                    <label className="text-sm font-medium text-gray-600">To</label>
                                    <Select value={outputToken} onValueChange={setOutputToken}>
                                        <SelectTrigger className="w-full bg-white">
                                            <SelectValue placeholder="Select Token">
                                                {outputToken && (
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-full ${getTokenColor(getTokenSymbol(outputToken))} flex items-center justify-center`}>
                                                            <span className="text-white font-bold text-sm">
                                                                {getTokenIcon(getTokenSymbol(outputToken))}
                                                            </span>
                                                        </div>
                                                        {getTokenSymbol(outputToken)}
                                                    </div>
                                                )}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(Tokens).map((token) => (
                                                <SelectItem key={token.address} value={token.address}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-full ${getTokenColor(token.symbol)} flex items-center justify-center`}>
                                                            <span className="text-white font-bold text-sm">
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
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600">Investment Amount</label>
                                <Input
                                    type="number"
                                    placeholder="Enter amount to invest"
                                    className="w-full text-lg h-12 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value={amount || ""}
                                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <label className="text-sm font-medium text-gray-600">
                                        Monthly Investment Day:
                                    </label>
                                </div>
                                <Select
                                    value={cronDate.toString()}
                                    onValueChange={(value) => setCronDate(parseInt(value))}
                                >
                                    <SelectTrigger className="w-40 bg-white">
                                        <SelectValue placeholder="Choose day" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {Array.from({ length: 30 }, (_, i) => i + 1).map((date) => (
                                            <SelectItem key={date} value={date.toString()}>
                                                {date}{date === 1 ? "st" : date === 2 ? "nd" : date === 3 ? "rd" : "th"} day of month
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Separator className="bg-gray-200" />

                        <Button
                            className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white transition-all duration-300 rounded-lg shadow-md hover:shadow-lg"
                            onClick={handleConfirm}
                            disabled={isLoading || !connected || amount <= 0 || !userPid || inputToken === outputToken}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Processing...
                                </div>
                            ) : (
                                "Confirm Investment"
                            )}
                        </Button>

                        <div className="text-xs text-center text-gray-500">
                            Your investment will be processed automatically on the {cronDate}{cronDate === 1 ? "st" : cronDate === 2 ? "nd" : cronDate === 3 ? "rd" : "th"} day of each month
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default InvestmentPage;
