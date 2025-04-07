export interface ReviewContent {
  id: string;
  reviewerId: string;
  reviewerName: string | null;
  starValue: number;
  content: string;
  postedAt: Date;
  replies: {
    id: string;
    replierId: string;
    replierName: string | null;
    content: string;
    postedAt: Date;
  }[];
}
