export interface RfcConnectionParameters {
    saprouter?: string;
    snc_lib?: string;
    snc_myname?: string;
    snc_partnername?: string;
    snc_qop?: EnumSncQop;
    trace?: EnumTrace;
    user?: string;
    passwd?: string;
    client: string;
    lang?: string;
    mysapsso2?: string;
    getsso2?: string;
    x509cert?: string;
    dest?: string;
    ashost?: string;
    sysnr?: string;
    gwhost?: string;
    gwserv?: string;
    group?: string;
    r3name?: string;
    sysid?: string;
    mshost?: string;
    msserv?: string;
    tpname?: string;
    program_id?: string;
}
interface RfcConnectionInfo {
    host: string;
    partnerHost: string;
    sysNumber: string;
    sysId: string;
    client: string;
    user: string;
    language: string;
    trace: string;
    isoLanguage: string;
    codepage: string;
    partnerCodepage: string;
    rfcRole: string;
    type: string;
    partnerType: string;
    rel: string;
    partnerRel: string;
    kernelRel: string;
    cpicConvId: string;
    progName: string;
    partnerBytesPerChar: string;
    reserved: string;
}
interface RfcClientVersion {
    major: string;
    minor: string;
    patch: string;
    binding: string;
}
export interface RfcCallOptions {
    notRequested?: Array<String>;
    timeout?: number;
}
export interface RfcAbapObject {
    [key: string]: string | number | Array<string> | Array<number> | Array<RfcAbapObject>;
}
declare enum EnumSncQop {
    DigSig = "1",
    DigSigEnc = "2",
    DigSigEncUserAuth = "3",
    BackendDefault = "8",
    Maximum = "9"
}
declare enum EnumTrace {
    Off = "0",
    Brief = "1",
    Verbose = "2",
    Full = "3"
}
export declare class Client {
    private __client;
    constructor(connectionParams: RfcConnectionParameters);
    open(): Promise<Client>;
    call(rfcName: string, rfcParams: RfcAbapObject, callOptions?: RfcCallOptions): Promise<RfcAbapObject>;
    connect(callback: Function): void;
    invoke(rfcName: string, rfcParams: RfcAbapObject, callback: Function, callOptions?: object): void;
    close(): object;
    reopen(callback: Function): void;
    ping(): void;
    readonly isAlive: boolean;
    readonly id: number;
    readonly version: RfcClientVersion;
    readonly connectionInfo: RfcConnectionInfo;
}
export {};
