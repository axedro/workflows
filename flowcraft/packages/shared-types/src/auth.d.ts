export interface User {
    id: string;
    email: string;
    name: string;
    organizationId?: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}
export interface Organization {
    id: string;
    name: string;
    plan: Plan;
    settings?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum UserRole {
    ADMIN = "ADMIN",
    USER = "USER",
    VIEWER = "VIEWER"
}
export declare enum Plan {
    FREE = "FREE",
    PRO = "PRO",
    TEAM = "TEAM",
    ENTERPRISE = "ENTERPRISE"
}
export interface AuthToken {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    organizationName?: string;
}
export interface AuthResponse {
    user: User;
    token: AuthToken;
}
//# sourceMappingURL=auth.d.ts.map