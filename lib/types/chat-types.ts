import {Chat, Message} from "@prisma/client";

export type ChatWithMessages = Chat & { messages: Message[] }