/**
 * @publicApi
 */
export interface ProcessOptions {
    name?: string;
    concurrency?: number;
}
/**
 * @publicApi
 */
export declare function Process(): MethodDecorator;
export declare function Process(name: string): MethodDecorator;
export declare function Process(options: ProcessOptions): MethodDecorator;
//# sourceMappingURL=process.decorator.d.ts.map