/**
 * Helper para gestión de políticas RBAC
 */
export declare class PolicyHelper {
    loadPolicy(path: string): Promise<void>;
    addPolicy(subject: string, object: string, action: string): Promise<boolean>;
    removePolicy(subject: string, object: string, action: string): Promise<boolean>;
}
//# sourceMappingURL=policy.helper.d.ts.map