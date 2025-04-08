export interface ReviewContent {
  id: string;
  reviewerId: string;
  reviewerName: string | null | undefined;
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

export type setUpdateReviewType = (prev: {
  ready: boolean;
  isUpdateDelete: boolean | null;
  updatedContent: string | null;
  updatedRating: number | null;
  id: string | null;
}) => void;

export interface updateReviewType {
  ready: boolean;
  isUpdateDelete: boolean | null;
  updatedContent: string | null;
  updatedRating: number | null;
  id: string | null;
}
