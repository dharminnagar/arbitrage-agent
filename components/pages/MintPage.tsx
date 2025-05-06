"use client";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { useConnection, useActiveAddress } from "arweave-wallet-kit";
import { toast } from "sonner";
import { CoinsIcon, Info, Loader2 } from "lucide-react";
import { dryrunResult, messageResult } from "@/lib/aoService";
import { mainProcessId } from "@/lib/config";

export const MintPage = () => {
    const { connected } = useConnection();
    const [amount, setAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [userPid, setUserPid] = useState<string | undefined>(undefined);
    
    const address = useActiveAddress();

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

    async function handleMint() {
        if (!connected) {
            toast.error("Please connect your wallet first");
            return;
        }

        if (amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (amount > 100) {
            toast.error("You can only mint up to 100 tokens at a time");
            return;
        }
        
        if (!userPid) {
            toast.error("User process ID not found. Please try again.");
            return;
        }
    
        try {
            setIsLoading(true);
            const res = await messageResult("yoNtlglzbxbwmRGECmSLX4q-lpEpUpbhSLkX8qlKXmo", [
                { name: "Action", value: "RequestTokens" },
                { name: "Quantity", value: amount.toString() },
                { name: "Recipient", value: userPid }
            ]);
            
            // Extract the success message from the response
            if (res && res.Messages && res.Messages[0]) {
                const message = res.Messages[1].Data || "Tokens minted successfully";
                toast.success(message);
            } else {
                toast.success("Tokens minted successfully");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to mint tokens");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center w-full py-16 px-8">
            <Card className="w-full max-w-6xl rounded-xl bg-white border border-neutral-200 shadow-lg overflow-hidden">
                <CardContent className="p-8 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full p-3 shadow-md">
                            <CoinsIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-bold text-gray-800">Mint Tokens</CardTitle>
                            <CardDescription className="text-lg text-gray-500">
                                Get test tokens for simulating your investments
                            </CardDescription>
                        </div>
                    </div>

                    <Separator className="bg-gray-200" />

                    <div className="space-y-6 max-w-lg mx-auto">
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                Token Amount
                                <div className="text-xs text-white bg-blue-500 rounded-full px-2 py-0.5">Max 100</div>
                            </label>
                            <Input
                                type="number"
                                placeholder="Enter amount to mint"
                                min={0}
                                max={100}
                                className="w-full text-lg h-12 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={amount || ""}
                                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                            />
                            <div className="text-sm text-gray-500 flex items-center gap-2 bg-blue-50 p-3 rounded-lg">
                                <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <div>These test tokens will be used for simulating investment strategies in the platform.</div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white transition-all duration-300 rounded-lg shadow-md hover:shadow-lg"
                                onClick={handleMint}
                                disabled={isLoading || !connected || amount <= 0}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Minting...
                                    </div>
                                ) : (
                                    "Mint Tokens"
                                )}
                            </Button>
                        </div>

                        <div className="text-xs text-center text-gray-500 flex items-center justify-center gap-2 italic">
                            <Info className="w-3 h-3" />
                            <div>NOTE: This is for testing purposes only</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default MintPage;
