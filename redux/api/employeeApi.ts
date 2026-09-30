import { baseApi } from "@/redux/api/baseApi";
import type {
  ApiEnvelope,
  PaginatedResult,
  PaginationParams,
} from "@/redux/api/types";

export interface Employee {
  id: string;
  name: string;
  designation: string;
  image: string | null;
  bio: string | null;
  twitter: string | null;
  linkedin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeListParams extends PaginationParams {
  search?: string;
}

export interface EmployeeCreateInput {
  name: string;
  designation: string;
  bio?: string;
  twitter?: string;
  linkedin?: string;
}

export type EmployeeUpdateInput = Partial<EmployeeCreateInput>;

interface EmployeeMutationArgs<TFields> {
  fields: TFields;
  image?: File;
}

function toEmployeeFormData<TFields>({
  fields,
  image,
}: EmployeeMutationArgs<TFields>) {
  const formData = new FormData();
  formData.append("bodyData", JSON.stringify(fields));
  if (image) formData.append("avatar", image);
  return formData;
}

export const employeeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query<PaginatedResult<Employee>, EmployeeListParams>(
      {
        query: ({ page, limit, search }) => ({
          url: "/employees",
          params: {
            page,
            limit,
            ...(search ? { search } : {}),
          },
        }),
        transformResponse: (response: ApiEnvelope<Employee[]>) => ({
          items: response.data,
          meta: response.meta!,
        }),
        providesTags: (result) =>
          result
            ? [
                ...result.items.map(({ id }) => ({
                  type: "Employee" as const,
                  id,
                })),
                { type: "Employee" as const, id: "LIST" },
              ]
            : [{ type: "Employee" as const, id: "LIST" }],
      },
    ),
    createEmployee: builder.mutation<
      Employee,
      EmployeeMutationArgs<EmployeeCreateInput>
    >({
      query: (args) => ({
        url: "/employees",
        method: "POST",
        body: toEmployeeFormData(args),
      }),
      transformResponse: (response: ApiEnvelope<Employee>) => response.data,
      invalidatesTags: [
        { type: "Employee", id: "LIST" },
        { type: "Stats", id: "OVERVIEW" },
      ],
    }),
    updateEmployee: builder.mutation<
      Employee,
      { id: string } & EmployeeMutationArgs<EmployeeUpdateInput>
    >({
      query: ({ id, ...args }) => ({
        url: `/employees/${id}`,
        method: "PATCH",
        body: toEmployeeFormData(args),
      }),
      transformResponse: (response: ApiEnvelope<Employee>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Employee", id },
        { type: "Employee", id: "LIST" },
      ],
    }),
    deleteEmployee: builder.mutation<void, string>({
      query: (id) => ({
        url: `/employees/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Employee", id: "LIST" },
        { type: "Stats", id: "OVERVIEW" },
      ],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} = employeeApi;
