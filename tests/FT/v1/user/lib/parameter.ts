
export interface UserGetParameter{
	limit?: number
	skip?: number
	username?: Array<string>
	sortby?: string
	order?: string
}

export interface UserPostParameter {
	username: string
	password: string
	userInfo?: string
	email?: string
	phone?: string
}

export interface UserPutParameter {
	username: string
	newName?: string
	userInfo?: string
	email?: string
	phone?: string
}

export interface UserDeleteParameter{
	username: Array<string>
}


export interface UserNameGetParameter {
	limit?: number
	skip?: number
	sortby?: string
	order?: string
}

export interface UserNamePutParameter {
	username: string
	newName: string
}


export interface UserNodeIdGetParameter extends UserGetParameter{
}

export interface UserNodeIdPostParameter{
	username: string
	nodeId: Array<string>
}

export interface UserNodeIdPutParameter extends UserNodeIdPostParameter{
}

export interface UserPasswordPutParameter {
	username: string
	oldPassword: string
	newPassword: string
}

export interface UserGroupGetParameter extends UserGetParameter{
}

export interface groups{
	role: string
	group: string
}

export interface UserGroupPostParameter {
	username: string
	groups: Array<groups>
}

export interface UserGroupPutParameter extends UserGroupPostParameter{
}


