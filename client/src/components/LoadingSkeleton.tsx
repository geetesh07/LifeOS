import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface SkeletonProps {
    count?: number;
    className?: string;
}

export function ListSkeleton({ count = 3, className = "" }: SkeletonProps) {
    return (
        <div className={`space-y-4 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function CardSkeleton({ count = 3, className = "" }: SkeletonProps) {
    return (
        <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="gap-2">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-4 w-4/5" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function TableSkeleton({ count = 5, className = "" }: SkeletonProps) {
    return (
        <div className={`space-y-3 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-8 w-[100px]" />
            </div>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/6" />
                </div>
            ))}
        </div>
    );
}

export function KanbanSkeleton({ count = 3, className = "" }: SkeletonProps) {
    return (
        <div className={`flex gap-6 overflow-x-auto pb-4 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex-1 min-w-[300px] space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-8 rounded-full" />
                    </div>
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-16 w-full" />
                            <div className="flex gap-2">
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-5 w-16" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-16 w-full" />
                        </CardContent>
                    </Card>
                </div>
            ))}
        </div>
    );
}
