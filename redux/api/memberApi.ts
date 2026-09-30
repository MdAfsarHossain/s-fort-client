import { baseApi } from "@/redux/api/baseApi";
import type {
  ApiEnvelope,
  PaginatedResult,
  PaginationParams,
} from "@/redux/api/types";

export type MemberRole =
  | "SUPERADMIN"
  | "ADMIN"
  | "MANAGER"
  | "EDITOR"
  | "DISPOSE";

export type MemberStatus = "ACTIVE" | "BLOCKED";

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: MemberRole;
  status: MemberStatus;
  twitter: string | null;
  linkedin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemberListParams extends PaginationParams {
  search?: string;
  role?: MemberRole;
  status?: MemberStatus;
}

export interface MemberCreateInput {
  name: string;
  email: string;
  password: string;
  role: MemberRole;
  twitter?: string;
  linkedin?: string;
}

export type MemberUpdateInput = Partial<
  Pick<Member, "name" | "email" | "role" | "status" | "twitter" | "linkedin">
>;

interface MemberMutationArgs<TFields> {
  fields: TFields;
  avatar?: File;
}

function toMemberFormData<TFields>({
  fields,
  avatar,
}: MemberMutationArgs<TFields>) {
  const formData = new FormData();
  formData.append("bodyData", JSON.stringify(fields));
  if (avatar) formData.append("avatar", avatar);
  return formData;
}

export const memberApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMembers: builder.query<PaginatedResult<Member>, MemberListParams>({
      query: ({ page, limit, search, role, status }) => ({
        url: "/admin/members",
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
          ...(role ? { role } : {}),
          ...(status ? { status } : {}),
        },
      }),
      transformResponse: (response: ApiEnvelope<Member[]>) => ({
        items: response.data,
        meta: response.meta!,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Member" as const,
                id,
              })),
              { type: "Member" as const, id: "LIST" },
            ]
          : [{ type: "Member" as const, id: "LIST" }],
    }),
    createMember: builder.mutation<
      Member,
      MemberMutationArgs<MemberCreateInput>
    >({
      query: (args) => ({
        url: "/admin/members",
        method: "POST",
        body: toMemberFormData(args),
      }),
      transformResponse: (response: ApiEnvelope<Member>) => response.data,
      invalidatesTags: [
        { type: "Member", id: "LIST" },
        { type: "Stats", id: "OVERVIEW" },
      ],
    }),
    updateMember: builder.mutation<
      Member,
      { id: string } & MemberMutationArgs<MemberUpdateInput>
    >({
      query: ({ id, ...args }) => ({
        url: `/admin/members/${id}`,
        method: "PATCH",
        body: toMemberFormData(args),
      }),
      transformResponse: (response: ApiEnvelope<Member>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Member", id },
        { type: "Member", id: "LIST" },
      ],
    }),
    deleteMember: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/members/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Member", id: "LIST" },
        { type: "Stats", id: "OVERVIEW" },
      ],
    }),
  }),
});

export const {
  useGetMembersQuery,
  useCreateMemberMutation,
  useUpdateMemberMutation,
  useDeleteMemberMutation,
} = memberApi;
