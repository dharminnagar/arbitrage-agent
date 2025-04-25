"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ArbitrageDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    details: string[];
}

export const ArbitrageDetailsDialog = ({ isOpen, onClose, details }: ArbitrageDetailsDialogProps) => {
    const [displayedLines, setDisplayedLines] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setDisplayedLines([]);
            let currentIndex = 0;
            const interval = setInterval(() => {
                if (currentIndex < details.length) {
                    setDisplayedLines(prev => [...prev, details[currentIndex]]);
                    currentIndex++;
                } else {
                    clearInterval(interval);
                }
            }, 500);

            return () => clearInterval(interval);
        }
    }, [isOpen, details]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl h-[600px] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="underline underline-offset-4">Arbitrage Details</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-4">
                    <div className="space-y-2 font-mono text-sm">
                        <AnimatePresence>
                            {displayedLines.map((line, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="whitespace-pre-wrap"
                                >
                                    {line}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}; 