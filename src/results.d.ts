import type {WorkspaceAppAuth} from './auth.js';
export type ResultUsage = {kind:'usage';eventId:string;occurredAt:string;provider:string;requestId:string;agentKind?:'root'|'subagent'|'unknown';inputTokens?:number;outputTokens?:number;cachedInputTokens?:number;cacheWriteTokens?:number;estimatedCostUsdMicros?:number};
export type ResultOutcome = {kind:'outcome';eventId:string;occurredAt:string;outcomeType:string;outcomeId:string};
export type ResultReference = {kind:'reference';eventId:string;occurredAt:string;operationRef:string;workId:string};
export declare function createResultsReporter(config:{auth:WorkspaceAppAuth;resource:string;sourceId:string;fetch?:typeof fetch;allowLocalhost?:boolean}):Readonly<{submit(request:Request,entries:Array<ResultUsage|ResultOutcome|ResultReference>):Promise<Response>}>;
