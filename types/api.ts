export interface ApiSuccess<TData> {
  success: true;
  message?: string;
  data: TData;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<TData> = ApiSuccess<TData> | ApiFailure;
