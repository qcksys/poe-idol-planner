import { createContext } from "react-router";

export const envContext = createContext<CloudflareBindings>();

export const exeContext = createContext<ExecutionContext>();
