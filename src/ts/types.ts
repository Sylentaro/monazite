export enum Pages {
    Home = 1,
    Chat = 2,
    Trip = 3,
    Profile = 4
}

export type Passenger = {
    id?: number;
    login: string;
    password: string;
    email: string;
}

export type Driver = {
    id?: number;
    login: string;
    password: string;
    email: string;
    carDescription? : string;
}