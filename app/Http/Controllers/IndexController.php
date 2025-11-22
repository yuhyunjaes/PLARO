<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class IndexController extends Controller
{
//    메인페이지 이동
    public function index() {
        return view('app');
    }


    public function login() {
        return view('login');
    }

    public function register() {
        return view('register');
    }
}
