import { useMemo } from 'react';
import { useOverviewKPIData } from './useOverviewKPIData';

export interface SocialMediaPlatform {
  platform: string;
  followers: number; // Using impressions as proxy for reach/followers
  growth: number;
  color: string;
}

export interface UseSocialMediaDataReturn {
  data: SocialMediaPlatform[];
  loading: boolean;
  error: string | null;
}

// Map of platform colors (consistent with branding)
const PLATFORM_COLORS = {
  Facebook: '#1877F2',
  Instagram: '#E4405F',
  Twitter: '#000000',
  YouTube: '#FF0000',
  TikTok: '#FF0050'
};

export function useSocialMediaData(selectedDate?: string, franchise: string = 'LAK'): UseSocialMediaDataReturn {
  const { data: overviewData, loading, debugInfo } = useOverviewKPIData(selectedDate, franchise);

  const socialData = useMemo((): SocialMediaPlatform[] => {
    if (!overviewData) {
      return [];
    }

    // Extract social media metrics from overview data
    // Using impressions as follower proxy and engagement rates as growth
    const platforms: SocialMediaPlatform[] = [
      {
        platform: 'Facebook',
        followers: overviewData.FBI ?? 0,
        growth: (overviewData.FBE ?? 0) * 100,
        color: PLATFORM_COLORS.Facebook
      },
      {
        platform: 'Instagram',
        followers: overviewData.IGI ?? 0,
        growth: (overviewData.IGE ?? 0) * 100,
        color: PLATFORM_COLORS.Instagram
      },
      {
        platform: 'Twitter',
        followers: overviewData.TWI ?? 0,
        growth: (overviewData.TWE ?? 0) * 100,
        color: PLATFORM_COLORS.Twitter
      },
      {
        platform: 'YouTube',
        followers: overviewData.YTI ?? 0,
        growth: (overviewData.YTE ?? 0) * 100,
        color: PLATFORM_COLORS.YouTube
      },
      {
        platform: 'TikTok',
        followers: overviewData.TTI ?? 0,
        growth: (overviewData.TTE ?? 0) * 100,
        color: PLATFORM_COLORS.TikTok
      }
    ];

    // Filter out platforms with no data
    return platforms.filter(p => p.followers > 0 || p.growth > 0);
  }, [overviewData]);

  return {
    data: socialData,
    loading,
    error: (debugInfo?.error as string | null)
  };
}
