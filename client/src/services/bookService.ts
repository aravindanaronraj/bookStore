import api from "../api/axios";

export interface BookImage {
  url: string;
  publicId: string;
  _id?: string;
}

export interface BookCategory {
  _id: string;
  name: string;
  slug: string;
}

export interface Book {
  _id: string;
  title: string;
  slug: string;
  author: string;
  publisher?: string;
  isbn?: string;
  description: string;

  category?: BookCategory;

  images: BookImage[];

  bookType: "physical" | "ebook" | "both";

  price: number;
  salePrice?: number;

  stock: number;

  language: string;
  pages?: number;

  isFeatured: boolean;
  isNewLaunch?: boolean;
  isActive?: boolean;
  averageRating?: number;
  reviewCount?: number;
}

interface BooksResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  books: Book[];
}

interface BookResponse {
  success: boolean;
  book: Book;
}

export interface BookFilters {
  search?: string;
  category?: string;
  language?: string;
  page?: number;
  limit?: number;
}

// Home page
export const getFeaturedBooks =
  async (): Promise<Book[]> => {
    const response =
      await api.get<BooksResponse>(
        "/books?featured=true&limit=4"
      );

    return response.data.books;
  };

export const getNewLaunchBooks = async (): Promise<Book[]> => (await api.get<BooksResponse>("/books?newLaunch=true&limit=4")).data.books;



  //get book

  export const getBooks = async (
  filters: BookFilters = {}
): Promise<BooksResponse> => {
  const response = await api.get<BooksResponse>(
    "/books",
    {
      params: filters,
    }
  );

  return response.data;
};

//get book by id

export const getBookById = async (
  id: string
): Promise<Book> => {
  const response = await api.get<BookResponse>(
    `/books/${id}`
  );

  return response.data.book;
};

