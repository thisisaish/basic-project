import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { AuthRes, AuthService } from '../shared/auth.service';
import { User } from '../shared/user.model';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {

  signupForm!: FormGroup;
  errorMsg = '';
  loginMode = false;
  isLoading = false;
  user!: User;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(){
    // let username = '';
    // let mail = '';
    // let password = '';
    this.signupForm = new FormGroup({
        'email': new FormControl('', [Validators.required, Validators.email]),
        'password': new FormControl('', [Validators.minLength(8), Validators.required])
    });
  }

  onSubmit(){
    // const newUser = new User(
    //   this.signupForm.value['username'],
    //   this.signupForm.value['email'],
    //   this.signupForm.value['password']
    // );
    let authObs : Observable<AuthRes>;

    this.isLoading = true;

    if(!this.loginMode){
      authObs = this.authService.signup(
        this.signupForm.value['email'],
        this.signupForm.value['password']
      );
    }else{
      authObs = this.authService.login(
        this.signupForm.value['email'],
        this.signupForm.value['password']
      );
    }

    authObs.subscribe(
      resData => {
        //TODO navigate to success page
        if(!this.loginMode){
          let verifyObs : Observable<string>;
          verifyObs = this.authService.verifyEmail(resData.idToken);
          verifyObs.subscribe(
            response => {
              console.log(response);
              this.router.navigate(['./home']);
            },
            errorMsg => {
              this.errorMsg = errorMsg;
              this.authService.deleteAccount(resData.idToken)
                .subscribe(
                  response => {

                  },
                  error => {
                    
                  }
                );
            }
          );
        }else{
          this.router.navigate(['./home']);
        }
        this.isLoading = false;
      },
      errorMsg => {
        this.errorMsg = errorMsg;
        this.isLoading = false;
      }
    );

    this.signupForm.reset();
  }

  switchMode(){
    this.loginMode = !this.loginMode;
  }

}
