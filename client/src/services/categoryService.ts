import api from "../api/axios";

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
}

interface CategoriesResponse {
  success: boolean;
  count: number;
  categories: Category[];
}

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get<CategoriesResponse>(
    "/categories"
  );

  return response.data.categories;
};
export interface CategoryInput { name: string; slug: string; description: string; image: string; isActive: boolean }
export const getAdminCategories = async () => (await api.get<{ categories: Category[] }>("/admin/categories")).data.categories;
const categoryForm = (data: CategoryInput, image?: File, removeImage = false) => { const form = new FormData(); Object.entries(data).forEach(([key, value]) => form.append(key, String(value))); if (image) form.append("image", image); if (removeImage) form.append("removeImage", "true"); return form; };
export const createAdminCategory = async (data: CategoryInput, image?: File) => { await api.post("/admin/categories", categoryForm(data, image), { headers: { "Content-Type": "multipart/form-data" } }); };
export const updateAdminCategory = async (id: string, data: CategoryInput, image?: File, removeImage = false) => { await api.put(`/admin/categories/${id}`, categoryForm(data, image, removeImage), { headers: { "Content-Type": "multipart/form-data" } }); };
export const deleteAdminCategory = async (id: string) => { await api.delete(`/admin/categories/${id}`); };
