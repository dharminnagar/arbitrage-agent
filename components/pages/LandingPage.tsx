"use client";
import { motion } from "framer-motion";
import { Card } from "../ui/card";
import { useEffect } from "react";
import { useConnection } from "arweave-wallet-kit";
import { toast } from "sonner";
import { FlipWords } from "../ui/flip-words";

const words = ["Arbitrage", "Investments", "Profits"];

export const LandingPage = () => {
    const { connected } = useConnection();

    useEffect(() => {
        if (connected) {
            toast("please wait while we connect to your wallet")
        }
    }, [connected])

    return (
        <div className="flex flex-col items-center justify-center h-[70vh]">
            <Card className="flex flex-col items-center justify-center h-[52vh] w-[58vw] bg-[white]/80 backdrop-blur-md border-gray-800 rounded-none">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center space-y-8 px-8"
                >
                    <h1 className="text-5xl font-bold text-gray-900 mb-4">
                        Experience Smart{" "}
                        <FlipWords words={words} duration={1000} />
                    </h1>
                    
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Connect your Arweave wallet to access real-time arbitrage opportunities across multiple exchanges
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="p-6 bg-white/50 backdrop-blur-sm rounded-lg border border-gray-200"
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Analysis</h3>
                            <p className="text-gray-600">Monitor multiple exchanges simultaneously for the best opportunities</p>
                        </motion.div>
                        
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="p-6 bg-white/50 backdrop-blur-sm rounded-lg border border-gray-200"
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cross-Exchange Trading</h3>
                            <p className="text-gray-600">Execute trades across different platforms to maximize profits</p>
                        </motion.div>
                        
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="p-6 bg-white/50 backdrop-blur-sm rounded-lg border border-gray-200"
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Transactions</h3>
                            <p className="text-gray-600">Built on Arweave for transparent and verifiable operations</p>
                        </motion.div>
                    </div>
                </motion.div>
            </Card>
        </div>
    );
};
