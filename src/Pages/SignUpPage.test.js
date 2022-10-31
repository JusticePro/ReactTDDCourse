import SignUpPage from "./SignUpPage.js";
import { render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from 'axios';
import { setupServer } from "msw/node"
import { rest } from "msw"
import '../locale/i18n';

describe('Sign Up Page', () =>
{
    describe('Layout', () =>
    {
        it('has a header', () => 
        {
            render(<SignUpPage />);
            const header = screen.queryByRole('heading', {name: 'Sign Up'});
            expect(header).toBeInTheDocument();
        });

        it('has username input', () =>
        {
            const { container } = render(<SignUpPage />);
            const input = screen.queryByLabelText('Username');
            expect(input).toBeInTheDocument();
        });

        it('has email input', () => 
        {
            const { container } = render(<SignUpPage></SignUpPage>);
            const input = screen.queryByLabelText('Email');
            expect(input).toBeInTheDocument();
        });

        it('has password input', () => 
        {
            const { container } = render(<SignUpPage></SignUpPage>);
            const input = screen.queryByLabelText('Password');
            expect(input).toBeInTheDocument();
        });

        it('has password type for password input', () => 
        {
            const { container } = render(<SignUpPage></SignUpPage>);
            const input = screen.queryByLabelText('Password');
            expect(input.type).toBe("password");
        });

        it('has repeat password input', () => 
        {
            const { container } = render(<SignUpPage></SignUpPage>);
            const input = screen.queryByLabelText('Repeat Password');
            expect(input).toBeInTheDocument();
        });

        it('has repeat password type for password input', () => 
        {
            const { container } = render(<SignUpPage></SignUpPage>);
            const input = screen.queryByLabelText('Repeat Password');
            expect(input.type).toBe("password");
        });

        it('has submit button', () => 
        {
            render(<SignUpPage></SignUpPage>);
            const button = screen.queryByRole('button', {name: 'Sign Up'});
            expect(button).toBeInTheDocument();
        });

        it('disables the submit button initially', () => 
        {
            render(<SignUpPage></SignUpPage>);
            const button = screen.queryByRole('button', {name: 'Sign Up'});
            expect(button).toBeDisabled();
        });
    });

    describe('Interactions', () => 
    {
        let requestBody;
        let counter = 0;
        const server = setupServer(rest.post("/api/1.0/users", (req, res, ctx) => {
            requestBody = req.body;
            counter++;
            return res(ctx.status(200));
        }));

        beforeEach(() => 
        {
            counter = 0;
            server.resetHandlers();
        });
        beforeAll(() => server.listen());
        afterAll(() => server.close());

        const setup = () =>
        {
            render(<SignUpPage></SignUpPage>);
            const inputUsername = screen.queryByLabelText('Username');
            const inputEmail = screen.queryByLabelText('Email');
            const inputPassword = screen.queryByLabelText('Password');
            const inputRepeat = screen.queryByLabelText('Repeat Password');

            userEvent.type(inputUsername, 'user1');
            userEvent.type(inputEmail, 'user1@mail.com');
            userEvent.type(inputPassword, 'P4ssword');
            userEvent.type(inputRepeat, 'P4ssword');

            const button = screen.queryByRole('button', {name: 'Sign Up'});

            return {button, inputPassword, inputRepeat, inputEmail, inputUsername};
        };

        it('enables the button when password and repeat password fields have the same value', () => 
        {
            const { button } = setup();
            expect(button).toBeEnabled();
        });

        it('sends username, email and password to backend after clicking the button', async () => 
        {
            const button = setup().button;

            userEvent.click(button);

            await screen.findByText('Please check your email to activate your account');

            //const firstCall = mockFn.mock.calls[0];
            //const body = firstCall[1];
            //const body = JSON.parse(firstCall[1].body);
            expect(requestBody).toEqual({
                username: 'user1',
                email: 'user1@mail.com',
                password: 'P4ssword'
            });

        });

        it('disables button when there is an ongoing api call', async () => 
        {
            counter = 0;
            const button = setup().button;

            userEvent.click(button);
            userEvent.click(button);

            await screen.findByText('Please check your email to activate your account');
            expect(counter).toBe(1);
        });

        it('displays spinner while the api request is in progress', async () => 
        {
            const button = setup().button;

            userEvent.click(button);
            const spinner = screen.getByRole('status', {hidden: true})

            expect(spinner).toBeInTheDocument();

        });

        it('does not display spinner while the api request is NOT in progress', async () => 
        {
            setup();
            const spinner = screen.getByRole('status', {hidden: true})

            expect(spinner).not.toBeVisible();

        });

        it('displays account activation notification after successful sign up request', async () => 
        {
            const button = setup().button;

            const message = 'Please check your email to activate your account';

            expect(screen.queryByText(message)).not.toBeInTheDocument();
            userEvent.click(button);

            const text = await screen.findByText(message);
            expect(text).toBeInTheDocument();
        });

        it('hides sign up form after successful sign up request', async () => 
        {
            const button = setup().button;
            const form = screen.getByTestId('form-sign-up');

            userEvent.click(button);

            await waitFor(() =>
            {
                expect(form).not.toBeInTheDocument();
            });
        });

        const generateValidationError = (field, message) =>
        {
            return rest.post("/api/1.0/users", (req, res, ctx) => {
                requestBody = req.body;
                return res(ctx.status(400), ctx.json({
                    validationErrors: { [field]: message }
                }));
            })
        };

        it('hides spinner and enables button after response received', async () => 
        {
            server.use(generateValidationError('username', 'Username cannot be null'));

            const button = setup().button;
            userEvent.click(button);

            await screen.findByText('Username cannot be null');
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
            expect(button).toBeEnabled();
        });

        it.each`
        field | message
        ${'username'} | ${'Username cannot be null'}
        ${'email'} | ${'Email cannot be null'}
        ${'password'} | ${'Password cannot be null'}
        `("displays $message for #field", async (args) =>
        {
            const { field, message } = args;

            server.use(generateValidationError(field, message));

            const button = setup().button;
            userEvent.click(button);

            await screen.findByText(message);
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
            expect(button).toBeEnabled();

        });

        it('displays mismatch message for pasword repeat input', () => 
        {
            const { inputPassword, inputRepeat } = setup();

            userEvent.type(inputPassword, 'P4ssword');
            userEvent.type(inputPassword, 'AnotherP4ssword');
            const validationError = screen.queryByText('Password mismatch');
            expect(validationError).toBeInTheDocument();
        });

        it.each`
        field | message | label
        ${'username'} | ${'Username cannot be null'} | ${'Username'}
        ${'email'} | ${'Email cannot be null'} | ${'Email'}
        ${'password'} | ${'Password cannot be null'} | ${'Password'}
        `('clears validation error after $field is updated', async ({field, message, label}) => 
        {
            server.use(generateValidationError(field, message));

            const { button } = setup();
            userEvent.click(button);

            const validationError = await screen.findByText(message);
            userEvent.type(screen.getByLabelText(label), 'Updated123!');
            expect(validationError).not.toBeInTheDocument();
        });
        
    });

    describe('Internationalization', () => 
    {
        it('initially displays all text in English', () => 
        {
            render(<SignUpPage></SignUpPage>);
            expect(screen.getByRole('heading', {name: 'Sign Up'})).toBeInTheDocument();
            expect(screen.getByRole('button', {name: 'Sign Up'})).toBeInTheDocument();
            expect(screen.getByLabelText('Username')).toBeInTheDocument();
            expect(screen.getByLabelText('Email')).toBeInTheDocument();
            expect(screen.getByLabelText('Password')).toBeInTheDocument();
            expect(screen.getByLabelText('Password Repeat')).toBeInTheDocument();
        });
    });
});