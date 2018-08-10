
export interface GroupQueryParameter{
	limit?: number
	skip?: number
	name?: Array<string>
	sortby?: string
	order?: string
}

export interface GroupBodyParameter {
	name: string;
	nodeId?: Array<string>;
	user?: Array<string>;
	groupInfo?: string;
}



export interface GroupPutParameter {
	name: string;
	newName?: string;
	user?: Array<string>;
	nodeId?: Array<string>;
	groupInfo?: string;
}
