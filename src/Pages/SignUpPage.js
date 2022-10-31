import React from "react";
import axios from 'axios';
import Input from "../components/Input";
import { withTranslation } from 'react-i18next';
import '../locale/i18n';

class SignUpPage extends React.Component
{

    state = {
        username: '',
        email: '',
        password: '',
        repeatPassword: '',
        apiProgress: false,
        signUpSuccess: false,

        errors: {}
    };

    onChange = (event) =>
    {
        const {id, value} = event.target;
        const errorsCopy = {... this.state.errors};
        delete errorsCopy[id];
        this.setState({
            [id]: value,
            errors: errorsCopy
        });
    }

    submit = async (event) =>
    {
        event.preventDefault();
        
        const {username, email, password} = this.state;
        const body = {
            username, email, password
        }
        this.setState({apiProgress: true});
        try
        {
            await axios.post('/api/1.0/users', body);
            this.setState({signUpSuccess: true});
        }catch (error)
        {
            if (error.response.status === 400)
            {
                this.setState({errors: error.response.data.validationErrors});
            }
            this.setState({apiProgress: false});
        }
    }

    render()
    {
        const { t } = this.props;
        const { password, repeatPassword, apiProgress, signUpSuccess, errors} = this.state;
        const disabled = !(password === repeatPassword && password.trim() !== '');

        let passwordMismatch = password !== repeatPassword ? 'Password mismatch' : '';

        return (
            <div className="col-lg-6 offset-lg-3 col-md-8 offset-md-2">
                {!signUpSuccess && (
                <form className="card mt-5" data-testid="form-sign-up">
                    <div className="card-header">
                        <h1 className="text-center">{t('signUp')}</h1>
                    </div>
                    <div className="card-body">
                        <Input id="username" label={t('username')} onChange={this.onChange} help={errors.username}></Input>
                        <Input id="email" label={t('email')} onChange={this.onChange} help={errors.email}></Input>
                        <Input id="password" label={t('password')} onChange={this.onChange} help={errors.password} inputType="password"></Input>
                        <Input id="repeatPassword" label={t('repeatPassword')} onChange={this.onChange} help={passwordMismatch} inputType="password"></Input>


                        <div className="text-center">
                            <button disabled={disabled || apiProgress} onClick={this.submit} className="btn btn-primary">
                                {t('signUpButton')} <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" hidden={!this.state.apiProgress}></span>
                            </button>
                        </div>
                    </div>
                </form>
                )}
                {signUpSuccess && (
                    <div className="alert alert-success mt-3">Please check your email to activate your account</div>
                    )}
            </div>
        );
    }
}

const signUpPageWithTranslation = withTranslation()(SignUpPage);

export default signUpPageWithTranslation;
