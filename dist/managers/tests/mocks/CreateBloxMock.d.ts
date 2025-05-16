import { Blox } from "../../../classes/Blox";
type PartialBloxProps = Partial<ConstructorParameters<typeof Blox>[0]>;
export declare function createMockBlox(overrides?: PartialBloxProps): Blox;
export {};
