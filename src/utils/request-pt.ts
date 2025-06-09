import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from "axios";
import qs from "qs";
import { clearPFToken, getPFToken } from "@/utils/auth";
import router from "@/router";
const service = axios.create({
  baseURL: import.meta.env.VITE_PT_BASE_API,
  timeout: 50000,
  headers: { "Content-Type": "application/json;charset=utf-8" },

  paramsSerializer: (params) => {
    return qs.stringify(params);
  },
});

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.headers.Authorization === "no-auth") {
      delete config.headers.Authorization;
    } else {
      const accessToken = getPFToken();
      if (accessToken) {
        config.headers.Authorization = accessToken;
      }
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const { responseType } = response.config;
    if (responseType === "blob") {
      return response;
    }

    const { data, errcode, errmsg } = response.data;
    if (errcode === 0) {
      return data;
    } else if (errcode === -100) {
      clearPFToken();
      router.push({ name: "ptLogin" });
      return Promise.reject(new Error(errmsg || "Error"));
    } else {
      ElMessage.error(errmsg || "系统出错");
    }
    return Promise.reject(new Error(errmsg || "Error"));
  },
  (error: any) => {
    return Promise.reject(error.message);
  }
);
export default service;
