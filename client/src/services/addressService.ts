import api from "../api/axios";

export interface Address {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export type AddressInput = Omit<Address, "_id" | "isDefault"> & { isDefault?: boolean };

export const getAddresses = async (): Promise<Address[]> => {
  const response = await api.get<{ addresses: Address[] }>("/addresses");
  return response.data.addresses;
};

export const createAddress = async (data: AddressInput): Promise<Address> => {
  const response = await api.post<{ address: Address }>("/addresses", data);
  return response.data.address;
};
export const updateAddress = async (id: string, data: AddressInput): Promise<Address> => (await api.put<{ address: Address }>(`/addresses/${id}`, data)).data.address;
export const deleteAddress = async (id: string): Promise<void> => { await api.delete(`/addresses/${id}`); };
export const setDefaultAddress = async (id: string): Promise<Address> => (await api.patch<{ address: Address }>(`/addresses/${id}/default`)).data.address;
