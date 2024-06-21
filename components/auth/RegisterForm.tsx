"use client";
import React, {useState} from "react";
import * as Yup from "yup";
import {Form, Formik} from "formik";
import {TextInput} from "../common/form_inputs/TextInput";
import {ButtonStd} from "../common/ui/ButtonStd";
import {H2m} from "../common/texts/H2m";
import {Pm} from "../common/texts/Pm";
import Image from "next/image";
import facebook from "../../public/auth/Facebook_Logo.svg";
import google from "../../public/auth/Google_Logo.svg";
import apple from "../../public/auth/Apple.svg";
import OpenEye from "../../public/auth/eye_open.svg";
import ClosedEye from "../../public/auth/eye_closed.svg";
import Link from "next/link";
// import {useRouter} from "next/navigation";
import {NewPasswordInput} from "../common/form_inputs/NewPasswordInput";
import { UserRegisterInterface } from "@/interfaces/user_auth";
import RegisterDateOfBirth from "./RegisterDateOfBirth";
import { handleRegister } from "@/utils/auth";
import LoadingAnimation from "../svgs/LoadingAnimation";
import { allowedPasswordCharactersRegex, passwordPolicyRegex } from "../../mock/passwordRegex";
import { validate as uuidValidate } from "uuid";
import "react-phone-number-input/style.css";
import { CustomPhoneInput } from "../common/form_inputs/CustomPhoneInput";
import { isPossiblePhoneNumber } from "react-phone-number-input";

interface RegisterFormProps {
  setUserUuid: React.Dispatch<React.SetStateAction<string>>
  setRegisterSuccess: React.Dispatch<React.SetStateAction<boolean>>
  setUserEmail: React.Dispatch<React.SetStateAction<string>>
}

Yup.addMethod(Yup.string, "isPossiblePhoneNumber", function (errorMessage) {
  return this.test("is-possible-phone-number", errorMessage, function (value) {
    const { path, createError } = this;
    return (
      value == null || isPossiblePhoneNumber(value) || createError({ path, message: errorMessage })
    );
  });
});

const validationSchema = Yup.object().shape({
  firstName: Yup.string()
    .matches(/^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,."-]+$/u, "Invalid characters in first name")
    .max(30, "First name must be no longer than 30 characters"),
  lastName: Yup.string()
    .matches(/^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,."-]+$/u, "Invalid characters in last name")
    .max(30, "Last name must be no longer than 30 characters"),
  birthdate: Yup.object().shape({
    // Test that each date number is valid
    day: Yup.number().min(1, "Please enter a valid day").max(31, "Please enter a valid day").required("Day is required"),
    month: Yup.number().min(1, "Please enter a valid month").max(12, "Please enter a valid month").required("Month is required"),
    year: Yup.number().min(1900, "Please enter a valid year").max(2024, "Please enter a valid year").required("Year is required")
  }).test("is-valid-date", "The date is invalid", value => {
    if (!value) return true;
    const { day, month, year } = value;
    if (month < 1 || month > 12) return false;
    if (day < 1) return false;
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) return false;
    return true;
  // TODO: I believe users can sign up at any age - needs to be checked
  // }).test("is-old-enough", "You need to be over 14 to enter this competition", value => {
  //   if (!value) return true;
  //   const { day, month, year } = value;
  //   const birthDate = new Date(year, month - 1, day);
  //   const age = calculateAge(birthDate);
  //   return age >= 14;
  }),
  phone: Yup.string()
    // .required("Phone number is required") // Not yet set up, may not make it to prod
    .isPossiblePhoneNumber("Phone number is invalid"),
  email: Yup.string().email("Not a recognized email address").required("Email is required"),
  password: Yup.string()
    .required("Password is required")
    .max(256, "Password must be at most 256 characters long")
    .test(
      "is-valid-password",
      function(value) {
        const { path, createError } = this;
        if (!allowedPasswordCharactersRegex.test(value || "")) {
          return createError({ path, message: "Password contains disallowed characters" });
        }
        if (!passwordPolicyRegex.test(value || "")) {
          return createError({ path, message: "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character" });
        }
        return true;
      }
    )
});

const initialValues: UserRegisterInterface = {
  firstName: "",
  lastName: "",
  email: "",
  birthdate: {day: undefined, month: undefined, year: undefined},
  phone: "",
  password: ""
};

export const RegisterForm: React.FC<RegisterFormProps> = ({setUserEmail, setRegisterSuccess, setUserUuid}) => {

  const [showPassword, setShowPassword] = useState(false);
  const [formSubmissionLoading, setFormSubmissionLoading] = useState(false);
  // const router = useRouter();

  const onSubmit = async (values: UserRegisterInterface) => {
    setFormSubmissionLoading(true);
    setUserEmail(values.email); // Set user email for use in verificationSubmit
    const result = await handleRegister(values);
    console.log(result);
    if (result?.success) {
      setRegisterSuccess(result.success);
      if (result?.message && uuidValidate(result.message)) {
        setUserUuid(result.message);
      }  
    }
    setFormSubmissionLoading(false);
  };


  return (
    <>
      <div className="max-w-[90%] sm:max-w-[70%] lg:max-w-[40%]">
        <H2m>Create an account</H2m>
        <Pm className="my-2" >Join us! Create your account to either vote for inspiring art or enter your own work.</Pm>
        <Pm className="my-2" >Registration begins on <b>June 15, 2024</b>.</Pm>
        <div className="grid">
          {formSubmissionLoading && 
            <div className="col-start-1 row-start-1">
              <LoadingAnimation scale={100} stroke={2}/>
            </div>
          }
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
          >
            {({ errors, touched, values, setFieldValue, setFieldTouched }) => (
              <Form 
                className={`${formSubmissionLoading && "blur-sm opacity-80"} col-start-1 row-start-1`}
              > {/* Disabled until contest begins: className="pointer-events-none opacity-50"*/}
                <div className="grid grid-cols-2 gap-4">
                  <TextInput inputType="string" className="mt-4" placeholder="John" error={errors.firstName}  touched={touched.firstName} value={values.firstName} labelText="First Name" id="firstName" />
                  <TextInput inputType="string" className="mt-4" placeholder="Doe" error={errors.lastName}  touched={touched.lastName} value={values.lastName} labelText="Last name" id="lastName" />
                </div>
                <RegisterDateOfBirth
                  name="birthdate"
                  errors={errors.birthdate ?? { day: undefined, month: undefined, year: undefined }}
                  touched={touched.birthdate ?? { day: false, month: false, year: false }}
                  values={values.birthdate}
                />
                <CustomPhoneInput
                  placeholder="+1 1234567890"
                  error={errors.phone}
                  touched={touched.phone}
                  value={values.phone}
                  labelText="Phone number"
                  required={true}
                  id="phone"
                  setFieldTouched={setFieldTouched}
                  setFieldValue={setFieldValue}
                />

                <TextInput inputType="email" className="" placeholder="johndoe@gmail.com" autoComplete="username" error={errors.email}  touched={touched.email} value={values.email} labelText="Email" id="email" />
                <div className="relative">
                  <NewPasswordInput inputType={`${!showPassword && "password" }`} className="mb-4" placeholder="Squk1*Bn" error={errors.password}  touched={touched.password} value={values.password} labelText="Password" id="password" />
                  <Image
                    className="absolute top-14 right-4 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    width={30} height={30}
                    src={showPassword ? OpenEye : ClosedEye }
                    alt="Show password button." />
                </div>
                <ButtonStd type="submit" className="w-full my-2">Sign up</ButtonStd>
              </Form>
            )}
          </Formik>
        </div>
        <Pm className="font-semibold my-4 text-center">Already have an account?
          <span className="text-main-blue font-semibold"><Link className="inline" href="/auth/login"> Log in here</Link></span>
        </Pm>
        <div className="invisible">
          <div className="flex flex-row">
            <div className=" mx-4 z-10 my-12 relative bg-main-grey w-full m-0 border-1 border-main-grey" />
            <p className="font-light my-auto text-2xl min-w-24 text-center">Or With</p>
            <div className="mx-4 z-10 my-auto relative bg-main-grey w-full m-0 border-1 border-main-grey" />
          </div>
          <div>
            <ButtonStd style={{borderRadius: "100px"}} className=" mb-6 w-full bg-neutral-white border-black">
              <Image width={30} src={facebook} alt="Facebook logo." />
              <Pm className="ml-4 text-black font-semibold">Sign up with Facebook</Pm>
            </ButtonStd>
            <ButtonStd style={{borderRadius: "100px"}} className="my-6 w-full bg-neutral-white border-black">
              <Image width={30} src={google} alt="Google logo." />
              <Pm className="ml-4 text-black font-semibold">Sign up with Google</Pm>
            </ButtonStd>
            <ButtonStd style={{borderRadius: "100px"}} className="my-6 w-full bg-neutral-white border-black">
              <Image width={30} src={apple} alt="Apple logo." />
              <Pm className="ml-4 text-black font-semibold">Sign up with Apple</Pm>
            </ButtonStd>
          </div>
        </div>
        {/*<Pm className="font-semibold my-4 text-center">Already have an account?*/}
        {/*  <span className="text-main-blue font-semibold"><Link className="inline" href="/auth/login"> Log in here</Link></span>*/}
        {/*</Pm>*/}
      </div>
    </>
  );
};