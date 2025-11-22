<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
//    아이디 중복체크
    public function checkId(Request $request) {
        $id = $request->id;

        $exists = User::where('user_id', $id)->exists();

        if($exists) {
            return response()->json(['success' => false]);
        }

        return response()->json(['success' => true]);
    }

//    이메일 확인 코드 전송
    public function sendEmail(Request $request) {
        $email = $request->email;
        if(empty($email)) return response()->json(['success' => false, 'message' => '이메일을 작성해주세요.', 'type' => 'danger']);

        $exists = User::where('email', $email)->exists();
        if($exists) return response()->json(['success' => false, 'message' => '이미 가입된 이메일입니다', 'type' => 'danger']);

        $code = rand(100000,999999);
        Session::put('code', $code);

        Mail::raw("회원가입 인증번호 : $code", function($message) use ($email) {
            $message->to($email)
                ->subject('라이프허브 회원가입 이메일 인증');
        });

        return response()->json(['success' => true, 'message' => '인증번호가 발송되었습니다.', 'type' => 'success']);
    }

//    이메일 코드 확인(세션기반)
    public function checkEmail(Request $request) {
        $code = $request->code;

        if (!$code) {
            return response()->json(['success' => false, 'message' => '인증번호를 입력해주세요.', 'type' => 'danger']);
        }

        if(Session::get('code') == $code) {
            Session::forget('code');
            return response()->json(['success' => true, 'message' => '인증이 완료되었습니다.', 'type' => 'success']);
        }

        return response()->json(['success' => false, 'message' => '인증번호가 일치하지 않습니다.', 'type' => 'danger']);
    }

//    회원가입
    public function register(Request $request) {
        $data = $request->validate([
            'user_id'=>['required', 'string', 'min:4', 'max:15', 'unique:users,user_id', 'regex:/^[a-zA-Z0-9]+$/'],
            'password'=>['required', 'confirmed', 'min:8', 'string'],
            'name'=>['required', 'string', 'min:2', 'max:5', 'regex:/^[가-힣]+$/'],
            'email' => ['required', 'email', 'unique:users,email'],
        ]);

        User::create([
            'user_id' => $data['user_id'],
            'password' => Hash::make($data['password']),
            'name' => $data['name'],
            'email' => $data['email'],
        ]);

        return Inertia::render('Auth/Login');
    }

//    로그인
    public function login(Request $request)
    {
        if (Auth::attempt($request->only(['user_id', 'password']))) {
            $request->session()->regenerate();

            return Inertia::location('/');
        }

        throw ValidationException::withMessages([
            'message' => '아이디 또는 비밀번호를 확인해주세요.',
        ]);
    }


//    로그아웃
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return inertia::location('/login');
    }

}
