<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Utils\ResponseUtils;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        protected ResponseUtils $response,
    ) {}

    /**
     * POST /api/register
     */
    public function register(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'name'     => 'required|string|max:255',
                'email'    => 'required|email|unique:users,email',
                'password' => 'required|string|min:8',
            ]);

            $user  = User::create([
                'name'     => $data['name'],
                'email'    => $data['email'],
                'password' => Hash::make($data['password']),
            ]);
            $token = $user->createToken('api')->plainTextToken;

            return $this->response->successData(['user' => $user, 'token' => $token], null, 201);
        } catch (ValidationException $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * POST /api/login
     */
    public function login(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'email'    => 'required|email',
                'password' => 'required|string',
            ]);

            if (!Auth::attempt(['email' => $data['email'], 'password' => $data['password']])) {
                return response()->json(['message' => 'Credenciales incorrectas.'], 401);
            }

            $user  = Auth::user();
            $token = $user->createToken('api')->plainTextToken;

            return $this->response->successData(['user' => $user, 'token' => $token]);
        } catch (ValidationException $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * POST /api/logout  (requires auth:sanctum)
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return $this->response->success(null, 'Sesión cerrada.');
    }

    /**
     * GET /api/me  (requires auth:sanctum)
     */
    public function me(Request $request): JsonResponse
    {
        return $this->response->successData($request->user()->only(['id', 'name', 'email', 'created_at']));
    }
}
