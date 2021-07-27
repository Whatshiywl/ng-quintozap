import { Component, OnInit } from '@angular/core';
import { AbstractControl, AbstractControlOptions, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { AuthService, User, UserCredential } from './auth.service';

@Component({
  selector: 'homaxi-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {
  user!: User | null;

  credentialForm: FormGroup;

  hidePassword = true;
  signup = false;

  errorMessage!: string | undefined;
  passwordResetSent = false;

  constructor (
    fb: FormBuilder,
    private auth: AuthService
  ) {
    this.credentialForm = fb.group({
      email: fb.control('', [ Validators.required, Validators.email ]),
      password: fb.control('', [ Validators.required, Validators.minLength(8) ]),
      confirmPassword: fb.control('')
    }, {
      validator: this.checkPasswordConfirm()
    } as AbstractControlOptions);
  }

  async ngOnInit() {
    this.auth.user.subscribe(user => {
      this.user = user;
      console.log('user changed to', user);
    });

    this.credentialForm.valueChanges.subscribe(() => {
      this.errorMessage = undefined;
      this.passwordResetSent = false;
    });
  }

  getEmailError() {
    const control = this.credentialForm.get('email');
    if (!control) return '';
    if (control.valid) return '';
    if (control.hasError('email')) return 'Invalid email';
    if (control.hasError('required')) return 'Email required';
    return '';
  }

  getPasswordError() {
    const control = this.credentialForm.get('password');
    if (!control) return '';
    if (control.valid) return '';
    if (control.hasError('minlength')) return 'Minimum of 8 characters';
    if (control.hasError('required')) return 'Password required';
    return '';
  }

  getConfirmPasswordError() {
    if (!this.signup) return '';
    const control = this.credentialForm.get('confirmPassword');
    if (!control) return '';
    if (control.valid) return '';
    if (control.hasError('eqPass')) return 'Must match password';
    return '';
  }

  async onSignup() {
    if (!this.signup) {
      this.signup = true;
      return;
    }
    const credential = await this.signupOrLogin(this.auth.createUserWithEmailAndPassword.bind(this.auth));
    if (credential) this.signup = false;
  }

  onLogin() {
    if (this.signup) {
      this.signup = false;
      this.resetConfirm();
    }
    this.signupOrLogin(this.auth.signInWithEmailAndPassword.bind(this.auth));
  }

  onGoogle() {
    this.genericAuth(this.auth.signInWithGooglePopup.bind(this.auth));
  }

  onLogout() {
    this.auth.signOut();
  }

  async onForgotPassword() {
    const control = this.credentialForm.get('email');
    if (!control || !control.valid || !control.value) return;
    const email = control.value;
    await this.auth.sendPasswordResetEmail(email);
    this.passwordResetSent = true;
  }

  private async signupOrLogin(method: (email: string, password: string) => Promise<UserCredential | undefined>) {
    if (!this.credentialForm.get('email')?.valid) return;
    if (!this.credentialForm.get('password')?.valid) return;
    if (this.signup && !this.credentialForm.get('confirmPassword')?.valid) return;
    const value = this.credentialForm.value;
    const caller = this.signupOrLoginCaller(method, value.email, value.password);
    return this.genericAuth(caller);
  }

  private signupOrLoginCaller(method: (email: string, password: string) => Promise<UserCredential | undefined>, email: string, password: string) {
    return () => method(email, password);
  }

  private async genericAuth(caller: () => Promise<UserCredential | undefined>) {
    this.resetPassword();
    this.resetConfirm();
    try {
      const result = await caller();
      this.resetEmail();
      return result;
    } catch (error) {
      console.error(error);
      this.errorMessage = error.message;
      return;
    }
  }

  private resetEmail() {
    this.credentialForm.get('email')?.reset();
  }

  private resetPassword() {
    this.credentialForm.get('password')?.reset();
  }

  private resetConfirm() {
    this.credentialForm.get('confirmPassword')?.reset();
  }

  private checkPasswordConfirm() {
    return (group: AbstractControl) => {
      const password = group.get('password');
      if (!password) throw new Error('Password Control not found on FormGroup!');
      const confirm = group.get('confirmPassword');
      if (!confirm) throw new Error('Password Control not found on FormGroup!');
      if (password.value !== confirm.value) {
        confirm.setErrors({ eqPass: true });
        return { eqPass: true } as ValidationErrors;
      } else {
        confirm.setErrors(null);
        return null;
      }
    }
  }

}
