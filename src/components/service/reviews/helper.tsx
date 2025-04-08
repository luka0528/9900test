export interface ReviewContent {
  id: string;
  reviewerId: string;
  reviewerName: string | null | undefined; // todo shouldn't be undefined?
  starValue: number;
  content: string;
  postedAt: Date;
  replies: {
    id: string;
    replierId: string;
    replierName: string | null | undefined;
    content: string;
    postedAt: Date;
  }[];
}
