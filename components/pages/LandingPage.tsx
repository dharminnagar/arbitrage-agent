"use client";
import { motion } from "framer-motion";
import { Card } from "../ui/card";
import { useEffect } from "react";
import { useConnection } from "arweave-wallet-kit";
import { toast } from "sonner";
import { FlipWords } from "../ui/flip-words";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight, BarChart3, Globe, ShieldCheck } from "lucide-react";

const words = ["Arbitrage", "Investments", "Profits"];

export const LandingPage = () => {
    const { connected } = useConnection();

    useEffect(() => {
        if (connected) {
            toast("please wait while we connect to your wallet")
        }
    }, [connected])

    return (
        <div className="flex flex-col items-center justify-center w-full py-16 px-8">
            <Card className="flex flex-col items-center justify-center w-full max-w-6xl bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center space-y-8 px-8 py-12 max-w-4xl mx-auto"
                >
                    <div className="space-y-4">
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                            Experience Smart{" "}
                            <FlipWords words={words} duration={1000} className="text-green-500" />
                        </h1>
                        
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
                            Connect your Arweave wallet to access real-time arbitrage opportunities and maximize your returns
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-6 pt-4">
                        <Link href="/arbitrage">
                            <Button 
                                className="px-6 py-6 text-base bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white transition-all duration-300 shadow-md hover:shadow-lg"
                            >
                                Start Trading
                                <ArrowRight className="ml-2" />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center"
                        >
                            <div className="rounded-full bg-blue-50 p-3 mb-4">
                                <BarChart3 className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Analysis</h3>
                            <p className="text-gray-500 text-sm">Monitor multiple exchanges simultaneously for the best opportunities</p>
                        </motion.div>
                        
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center"
                        >
                            <div className="rounded-full bg-green-50 p-3 mb-4">
                                <Globe className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cross-Exchange Trading</h3>
                            <p className="text-gray-500 text-sm">Execute trades across different platforms to maximize profits</p>
                        </motion.div>
                        
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center"
                        >
                            <div className="rounded-full bg-purple-50 p-3 mb-4">
                                <ShieldCheck className="h-6 w-6 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Transactions</h3>
                            <p className="text-gray-500 text-sm">Built on Arweave for transparent and verifiable operations</p>
                        </motion.div>
                    </div>
                </motion.div>
            </Card>
        </div>
    );
};
