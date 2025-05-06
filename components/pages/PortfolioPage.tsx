"use client";
import { useActiveAddress, useConnection } from "arweave-wallet-kit";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { mainProcessId } from "@/lib/config";
import { dryrunResult, messageResult } from "@/lib/aoService";
import { CalendarIcon, Loader2, PlusCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tokens } from "@/lib/config";

type Investment = {
    ID: number;
    Wallet_Address: string;
    InputTokenAddress: string;
    OutputTokenAddress: string;
    Amount: number;
    Date: string;
    RecurringDay: number;
    Active?: boolean;
}

const InvestmentPlansDialog = ({ 
    open, 
    onOpenChange, 
    investments,
    onCancelInvestment,
    cancelLoading
}: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
    investments: Investment[];
    onCancelInvestment: (id: number) => Promise<void>;
    cancelLoading: number | null;
}) => {
    const getNextInvestmentDate = (recurringDay: number) => {
        const today = new Date();
        const nextDate = new Date(today.getFullYear(), today.getMonth(), recurringDay);
        if (nextDate < today) {
            nextDate.setMonth(nextDate.getMonth() + 1);
        }
        return nextDate;
    };

    const getTokenSymbol = (address: string) => {
        return Object.values(Tokens).find(token => token.address === address)?.symbol || 'Unknown';
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white rounded-xl border-0 shadow-xl">
                <DialogHeader className="pb-2 border-b border-gray-100">
                    <DialogTitle className="text-2xl font-semibold text-gray-800">Investment Plans</DialogTitle>
                    <DialogDescription className="text-gray-500">
                        View and manage your active investment plans
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    {investments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="rounded-full bg-gray-100 p-4 mb-4">
                                <CalendarIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 mb-2">No investment plans found</p>
                            <p className="text-sm text-gray-500">Create a new investment to get started</p>
                        </div>
                    ) : (
                        investments.map((investment, index) => {
                            const nextDate = getNextInvestmentDate(investment.RecurringDay);
                            // Convert to number for consistent comparison
                            const activeValue = investment.Active === true ? 1 : Number(investment.Active || 0);
                            const isCancelled = activeValue !== 1;
                            
                            return (
                                <div key={index} className={`flex items-center justify-between p-4 border ${isCancelled ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'} rounded-xl shadow-sm transition-all duration-200 hover:shadow-md`}>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-10 h-10 rounded-full ${isCancelled ? 'bg-gray-300' : 'bg-gradient-to-r from-blue-500 to-blue-600'} flex items-center justify-center shadow-sm`}>
                                                <span className="text-white font-bold">{getTokenSymbol(investment.InputTokenAddress).charAt(0)}</span>
                                            </div>
                                            <div>
                                                <div className="font-medium flex items-center gap-2 text-gray-800">
                                                    {getTokenSymbol(investment.InputTokenAddress)} → {getTokenSymbol(investment.OutputTokenAddress)}
                                                    {isCancelled && (
                                                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">
                                                            Cancelled
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {Number(investment.Amount || 0).toFixed(2)} tokens
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    ID: {investment.ID}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="text-right">
                                            <div className="font-medium text-sm text-gray-600">Next Investment</div>
                                            <div className="text-sm font-semibold text-gray-800">
                                                {isCancelled ? 'N/A' : nextDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </div>
                                        {!isCancelled && (
                                            <Button 
                                                variant="destructive" 
                                                size="sm"
                                                onClick={() => onCancelInvestment(investment.ID)}
                                                disabled={cancelLoading === investment.ID}
                                                className="bg-red-500 hover:bg-red-600 text-xs px-3 py-1 h-auto"
                                            >
                                                {cancelLoading === investment.ID ? (
                                                    <>
                                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                        Cancelling...
                                                    </>
                                                ) : (
                                                    'Cancel'
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export const PortfolioPage = () => {
    const { connected } = useConnection();
    const address = useActiveAddress();
    const [loading, setLoading] = useState(false);
    const [totalInvested, setTotalInvested] = useState<string>("0.00");
    const [totalReturns, setTotalReturns] = useState<string>("0.00");
    const [activeInvestments, setActiveInvestments] = useState(0);
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [nextInvestmentDate, setNextInvestmentDate] = useState<Date | null>(null);
    const [cancelLoading, setCancelLoading] = useState<number | null>(null);

    const fetchData = async () => {
        setLoading(true);
        if(!connected || !address) {
            toast("dum dum requires your wallet to continue");
            return;
        }
        // Fetch investment data from database
        const investmentData: Investment[] = await dryrunResult(mainProcessId, [
            { name: "Action", value: "getInvestmentPlans" },
            { name: "Wallet_Address", value: address },
        ]);

        console.log(investmentData);

        setInvestments(investmentData);
        setTotalInvested(investmentData.reduce((acc: number, curr: Investment) => acc + Number(curr.Amount || 0), 0).toFixed(2));
        setTotalReturns(investmentData.reduce((acc: number, curr: Investment) => acc + (Number(curr.Amount || 0) - (Number(curr.Amount || 0) * 0.90)), 0).toFixed(2));
        // Count only active investments
        const activeCount = investmentData.filter(inv => {
            const activeValue = inv.Active === true ? 1 : Number(inv.Active || 0);
            return activeValue === 1;
        }).length;
        setActiveInvestments(activeCount);

        // Calculate next investment date
        if (investmentData.length > 0) {
            const today = new Date();
            const nextDates = investmentData.map(inv => {
                const nextDate = new Date(today.getFullYear(), today.getMonth(), inv.RecurringDay);
                if (nextDate < today) {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                }
                return nextDate;
            });
            const closestDate = nextDates.reduce((a, b) => a < b ? a : b);
            setNextInvestmentDate(closestDate);
        }

        console.log(investmentData);
        setLoading(false);
    };
    
    useEffect(() => {
        console.log("Connected", connected + ": " + address);
        if (!connected || !address) {
            toast("dum dum requires your wallet to continue");
            return;
        } else {
            toast("dum dum says your wallet is connected!");
        }

        fetchData();
    }, [connected, address]);

    const handleCancelInvestment = async (id: number) => {
        try {
            setCancelLoading(id);
            // Call the CancelInvestment handler

            console.log("Cancelling investment", id);
            const result = await messageResult(mainProcessId, [
                { name: "Action", value: "CancelInvestment" },
                { name: "InvestmentID", value: id.toString() },
            ]);

            console.log(result);
            
            // Update local state immediately to show cancelled
            setInvestments(prevInvestments => 
                prevInvestments.map(inv => 
                    inv.ID === id ? { ...inv, Active: false } : inv
                )
            );
            
            toast.success("Investment plan cancelled successfully!");
            // Refresh data after cancellation to ensure consistency
            await fetchData();
        } catch (error) {
            console.error("Error cancelling investment:", error);
            toast.error("Failed to cancel investment plan");
        } finally {
            setCancelLoading(null);
        }
    };

    const LoadingSpinner = () => (
        <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
    );

    return (
        <div className="flex flex-col items-center justify-center w-full py-16 px-8">
            <Card className="w-full max-w-6xl rounded-xl bg-white border border-neutral-200 shadow-lg overflow-hidden">
                <CardContent className="p-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-3xl mb-1 text-gray-800 font-bold">Portfolio Overview</CardTitle>
                            <CardDescription className="text-lg text-gray-500">
                                Your Investment Statistics
                            </CardDescription>
                        </div>
                        <Link href="/invest">
                            <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all shadow-md hover:shadow-lg">
                                <PlusCircle className="h-4 w-4" />
                                New Investment
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="rounded-full bg-blue-100 p-2">
                                        <TrendingUp className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <h3 className="font-medium text-gray-800">Total Invested</h3>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    {loading ? (
                                        <LoadingSpinner />
                                    ) : (
                                        <>
                                            <span className="text-3xl font-bold text-gray-800">{totalInvested}</span>
                                            <span className="text-lg text-gray-600 font-medium">AR</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="rounded-full bg-green-100 p-2">
                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                    </div>
                                    <h3 className="font-medium text-gray-800">Total Returns</h3>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    {loading ? (
                                        <LoadingSpinner />
                                    ) : (
                                        <>
                                            <span className="text-3xl font-bold text-green-600">+{totalReturns}</span>
                                            <span className="text-lg text-gray-600 font-medium">AR</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 shadow-sm">
                                <h3 className="font-medium text-gray-800 mb-4">Active Investments</h3>
                                <div className="flex items-baseline justify-between">
                                    {loading ? (
                                        <LoadingSpinner />
                                    ) : (
                                        <>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-bold text-gray-800">{activeInvestments}</span>
                                                <span className="text-lg text-gray-600 font-medium">positions</span>
                                            </div>
                                            <Button 
                                                variant="link" 
                                                className="text-sm text-blue-600 hover:text-blue-700"
                                                onClick={() => setDialogOpen(true)}
                                            >
                                                View All
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-blue-50 to-gray-50 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="rounded-full bg-blue-100 p-2">
                                        <CalendarIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <h3 className="font-medium text-gray-800">Next Investment Date</h3>
                                </div>
                                <div className="text-3xl font-bold text-gray-800">
                                    {loading ? (
                                        <LoadingSpinner />
                                    ) : (
                                        nextInvestmentDate ? (
                                            <div className="flex flex-col">
                                                <span className="text-3xl">{nextInvestmentDate.getDate()}</span>
                                                <span className="text-xs text-gray-500">
                                                    {nextInvestmentDate.toLocaleString('default', { month: 'short' })} {nextInvestmentDate.getFullYear()}
                                                </span>
                                            </div>
                                        ) : '-'
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-2" />
                    
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                            Recent Activity
                        </h3>
                        {/* Activity section placeholder */}
                    </div>
                </CardContent>
            </Card>

            <InvestmentPlansDialog 
                open={dialogOpen} 
                onOpenChange={setDialogOpen} 
                investments={investments}
                onCancelInvestment={handleCancelInvestment}
                cancelLoading={cancelLoading}
            />
        </div>
    );
};

export default PortfolioPage;