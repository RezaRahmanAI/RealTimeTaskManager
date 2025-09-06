using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace TaskManagerApi.Controllers
{
    public class RegisterModel
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginModel
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;  // Added
        private readonly IConfiguration _configuration;

        public AuthController(UserManager<IdentityUser> userManager, RoleManager<IdentityRole> roleManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            Console.WriteLine("AuthController initialized");
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            try
            {
                Console.WriteLine($"Register: Username={model.Username}, Email={model.Email}");
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                    Console.WriteLine("Validation Errors: " + string.Join(", ", errors));
                    return BadRequest(new { Errors = errors });
                }

                var user = new IdentityUser { UserName = model.Username, Email = model.Email };
                var result = await _userManager.CreateAsync(user, model.Password);
                if (result.Succeeded)
                {
                    if (!await _roleManager.RoleExistsAsync("User"))
                        await _roleManager.CreateAsync(new IdentityRole("User"));
                    await _userManager.AddToRoleAsync(user, "User");
                    // For demo, make first user admin
                    var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
                    if (adminUsers.Count == 0)
                    {
                        if (!await _roleManager.RoleExistsAsync("Admin"))
                            await _roleManager.CreateAsync(new IdentityRole("Admin"));
                        await _userManager.AddToRoleAsync(user, "Admin");
                    }
                    Console.WriteLine($"User {model.Username} registered");
                    return Ok(new { Message = "User registered successfully" });
                }
                return BadRequest(new { Errors = result.Errors.Select(e => e.Description) });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Register Exception: {ex.Message}");
                return StatusCode(500, new { Error = "Registration failed", Details = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            try
            {
                Console.WriteLine($"Login: Username={model.Username}");
                var user = await _userManager.FindByNameAsync(model.Username);
                if (user != null )
                {
                    var token = GenerateJwtToken(user);
                    Console.WriteLine($"Login successful: Token={token.Substring(0, 20)}...");
                    return Ok(new { Token = token }); // Ensure "Token" matches frontend
                }
                Console.WriteLine("Login failed: Invalid credentials");
                return Unauthorized(new { Error = "Invalid username or password" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Login Exception: {ex.Message}");
                return StatusCode(500, new { Error = "Login failed", Details = ex.Message });
            }
        }

        private string GenerateJwtToken(IdentityUser user)
        {
            var claims = new[]
            {
        new Claim(JwtRegisteredClaimNames.Sub, user.Id),                // use userId here
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        new Claim(ClaimTypes.NameIdentifier, user.Id),                  // still keep NameIdentifier
        new Claim(ClaimTypes.Name, user.UserName)                       // optional username claim
    };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(1),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

    }
}