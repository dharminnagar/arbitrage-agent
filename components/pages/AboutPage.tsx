import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GitHubIconDark, TwitterIcon, LinkedInIcon } from "@/lib/icons";
import Image from "next/image";
import { ArrowRight, Code, DollarSign, Lightbulb } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

export const AboutPage = () => {
    return (
        <div className="flex flex-col items-center justify-center w-full py-16 px-8">
            <Card className="w-full max-w-6xl rounded-xl bg-white border border-neutral-200 shadow-lg overflow-hidden">
                <CardContent className="p-8 space-y-10">
                    {/* Project Information Section */}
                    <div className="space-y-8 max-w-4xl mx-auto">
                        <div className="text-center space-y-3">
                            <CardTitle className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">About DeltaFi</CardTitle>
                            <CardDescription className="text-xl text-gray-600 font-light">
                                An autonomous arbitrage bot built on the AO protocol that monitors multiple DEXes on Arweave for profitable trading opportunities
                            </CardDescription>
                        </div>
                        
                        <div className="prose prose-lg max-w-none text-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
                                <div className="flex flex-col items-center bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100 shadow-sm">
                                    <div className="rounded-full bg-blue-100 p-4 mb-4">
                                        <Code className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-center text-gray-800 mb-3">Powered by AO</h3>
                                    <p className="text-center text-gray-600 text-sm">
                                        Our platform leverages the power of <span className="font-bold">AO protocol</span> to create autonomous agents that monitor price differences between DEXes in real-time.
                                    </p>
                                </div>
                                
                                <div className="flex flex-col items-center bg-gradient-to-br from-green-50 to-white p-6 rounded-xl border border-green-100 shadow-sm">
                                    <div className="rounded-full bg-green-100 p-4 mb-4">
                                        <DollarSign className="h-6 w-6 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-center text-gray-800 mb-3">Profit Maximization</h3>
                                    <p className="text-center text-gray-600 text-sm">
                                        When DeltaFi detects price discrepancies across exchanges, it automatically executes trades to capture profit by buying low and selling high.
                                    </p>
                                </div>
                                
                                <div className="flex flex-col items-center bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-100 shadow-sm">
                                    <div className="rounded-full bg-purple-100 p-4 mb-4">
                                        <Lightbulb className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-center text-gray-800 mb-3">Fully Configurable</h3>
                                    <p className="text-center text-gray-600 text-sm">
                                        The agent is fully customizable, allowing you to set parameters like slippage tolerance, minimum profit thresholds, and specific token pairs.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center pt-6">
                            <Link href="/arbitrage">
                                <Button 
                                    className="px-6 py-6 text-base bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white transition-all duration-300 shadow-md hover:shadow-lg"
                                >
                                    Get Started
                                    <ArrowRight className="ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <Separator className="my-8 bg-gray-200" />

                    {/* Meet the Buidlers Section */}
                    <div className="space-y-10 max-w-4xl mx-auto">
                        <CardTitle className="text-3xl font-bold text-center text-gray-800">Meet the Buidlers</CardTitle>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            {/* Yatharth's Card */}
                            <div className="transform transition-all duration-300 hover:-translate-y-2">
                                <Card className="overflow-hidden shadow-lg bg-white border-0">
                                    <div className="p-6 space-y-4 text-center">
                                        <div className="mx-auto rounded-full overflow-hidden w-24 h-24 border-4 border-gray-50">
                                            <div className="relative w-full h-full bg-blue-100">
                                                <div className="absolute inset-0 flex items-center justify-center text-blue-500 font-semibold text-xl">YS</div>
                                            </div>
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">Yatharth Singh Panwar</CardTitle>
                                            <CardDescription>Co-Buidler</CardDescription>
                                        </div>
                                        <div className="flex items-center justify-center gap-4 mt-4">
                                            <a
                                                href="https://github.com/yatharth-singh-panwar"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="hover:opacity-80 transition-opacity"
                                            >
                                                <GitHubIconDark size={22} />
                                            </a>
                                            <a
                                                href="https://twitter.com/yatharthpnwr"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="hover:opacity-80 transition-opacity"
                                            >
                                                <TwitterIcon size={22} />
                                            </a>
                                            <a
                                                href="https://www.linkedin.com/in/yatharth-singh-panwar-153058288"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="hover:opacity-80 transition-opacity"
                                            >
                                                <LinkedInIcon size={22} />
                                            </a>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Team Image - Center */}
                            <div className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                                <Image
                                    src="/images/buidlers.jpeg"
                                    alt="The Buidlers"
                                    width={400}
                                    height={400}
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center p-6">
                                    {/* <span className="text-white text-lg font-medium">DeltaFi Team</span> */}
                                </div>
                            </div>

                            {/* Dharmin's Card */}
                            <div className="transform transition-all duration-300 hover:-translate-y-2">
                                <Card className="overflow-hidden shadow-lg bg-white border-0">
                                    <div className="p-6 space-y-4 text-center">
                                        <div className="mx-auto rounded-full overflow-hidden w-24 h-24 border-4 border-gray-50">
                                            <div className="relative w-full h-full bg-green-100">
                                                <div className="absolute inset-0 flex items-center justify-center text-green-500 font-semibold text-xl">DN</div>
                                            </div>
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">Dharmin Nagar</CardTitle>
                                            <CardDescription>Co-Buidler</CardDescription>
                                        </div>
                                        <div className="flex items-center justify-center gap-4 mt-4">
                                            <a
                                                href="https://github.com/dharminnagar"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="hover:opacity-80 transition-opacity"
                                            >
                                                <GitHubIconDark size={22} />
                                            </a>
                                            <a
                                                href="https://twitter.com/dharminnagar"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="hover:opacity-80 transition-opacity"
                                            >
                                                <TwitterIcon size={22} />
                                            </a>
                                            <a
                                                href="https://linkedin.com/in/nagardharmin"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="hover:opacity-80 transition-opacity"
                                            >
                                                <LinkedInIcon size={22} />
                                            </a>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AboutPage;