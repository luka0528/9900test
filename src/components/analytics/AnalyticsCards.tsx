import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { AnalyticsTotalRevenueCard } from '~/components/analytics/AnalyticsTotalRevenueCard';

export const AnalyticsCards = () => {
    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 m-4">
            <AnalyticsTotalRevenueCard />
        </div>
    );
}