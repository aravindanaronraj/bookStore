import api from "../api/axios";
export interface BookReview { _id: string; user: { _id: string; name: string }; rating: number; comment: string; createdAt: string; updatedAt: string }
export interface ReviewsResponse { reviews: BookReview[]; averageRating: number; reviewCount: number }
export const getBookReviews = async (bookId: string) => (await api.get<ReviewsResponse>(`/books/${bookId}/reviews`)).data;
export const saveBookReview = async (bookId: string, rating: number, comment: string) => (await api.post(`/books/${bookId}/reviews`, { rating, comment })).data;
