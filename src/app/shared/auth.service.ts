import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";

import { catchError, tap } from "rxjs/operators";
import { Subject, throwError } from "rxjs";

import { User } from "./user.model";

export interface AuthRes{
    idToken: string,
    email: string,
    refreshToken: string,
    expiresIn: string,
    localId: string
}

@Injectable({
    providedIn: 'root'
})
export class AuthService{

    user = new Subject<User>();

    constructor(private http: HttpClient){}

    signup(email: String, pass: String){
        return this.http.post<AuthRes>(
            'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyDPbZiEi1MOnX_CWQ1b3YhG9zbEHmZv1Is', 
            {
                email: email,
                password: pass,
                returnSecureToken: true
            }
        ).pipe(catchError(this.handleError), tap(resData => {
            this.handleAuthentication(resData.email, resData.localId, resData.idToken, +resData.expiresIn);
        }));
    }

    login(email: string, password: string){
        return this.http.post<AuthRes>(
            'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDPbZiEi1MOnX_CWQ1b3YhG9zbEHmZv1Is',
            {
                email: email,
                password: password,
                returnToSecure: true
            }
        ).pipe(catchError(this.handleError));
    }

    verifyEmail(token: string){
        return this.http.post<string>(
            'https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=AIzaSyDPbZiEi1MOnX_CWQ1b3YhG9zbEHmZv1Is',
            {
                requestType: 'VERIFY_EMAIL',
                idToken: token
            }
        );
    }

    deleteAccount(token: string){
        return this.http.post(
            'https://identitytoolkit.googleapis.com/v1/accounts:delete?key=AIzaSyDPbZiEi1MOnX_CWQ1b3YhG9zbEHmZv1Is',
            {
                idToken: token
            }
        );
    }

    private handleAuthentication(email: string, userId: string, token: string, expiresIn: number){
        const expiration = new Date(new Date().getTime() + expiresIn * 1000);
        const newUser = new User(email,userId, token, expiration);
        this.user.next(newUser);
    }

    private handleError(errorRes: HttpErrorResponse){
        let errorMsg = 'An unknown error occurred!';
            if(!errorRes.error || !errorRes.error.error){
                return throwError(errorMsg);
            }
            switch(errorRes.error.error.message){
                case 'EMAIL_NOT_FOUND':
                    errorMsg = 'Email not found! Try signing up';
                    break;
                case 'INVALID_PASSWORD':
                    errorMsg = 'Password invalid!';
                    break;
                case 'USER_DISABLED':
                    errorMsg = 'Account has been disabled. Contact the Admin';
                    break;
                case 'EMAIL_EXISTS':
                    errorMsg = 'Email exists already! Try signing in';
                    break;
                case 'OPERATION_NOT_ALLOWED':
                    errorMsg = 'Password sign-in is disabled';
                    break;
                case 'TOO_MANY_ATTEMPTS_TRY_LATER':
                    errorMsg = 'We have blocked all requests from this device due to unusual activity. Try again later.';
                    break;
                case 'INVALID_ID_TOKEN':
                    errorMsg = 'Try signing in again';
                    break;
                case 'USER_NOT_FOUND':
                    errorMsg = 'User not found';
                    break;
            } 
        return throwError(errorMsg);    
    }
}