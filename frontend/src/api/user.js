import axios from "../utils/axiosInstance";

export const fetchUserProfile = (id, token) => {
  return axios.get(`/users/${id}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
