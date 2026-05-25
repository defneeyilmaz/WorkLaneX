using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkLaneX.Application.Features.Auth.Commands.Login;
using WorkLaneX.Application.Features.Auth.Commands.Register;
using WorkLaneX.Application.Features.Auth.Queries.GetCurrentUser;

namespace WorkLaneX.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(
                new RegisterCommand(request.Email, request.Password, request.FullName),
                cancellationToken);

            if (!result.Succeeded)
            {
                return BadRequest(new { error = result.Error, errors = result.Errors });
            }

            return Ok(result.Value);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { errors = ex.Errors.Select(e => e.ErrorMessage) });
        }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(
                new LoginCommand(request.Email, request.Password),
                cancellationToken);

            if (!result.Succeeded)
            {
                return Unauthorized(new { error = result.Error });
            }

            return Ok(result.Value);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { errors = ex.Errors.Select(e => e.ErrorMessage) });
        }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims();

        if (userId is null)
        {
            return Unauthorized();
        }

        var user = await _mediator.Send(new GetCurrentUserQuery(userId.Value), cancellationToken);

        if (user is null)
        {
            return NotFound();
        }

        return Ok(user);
    }

    private Guid? GetUserIdFromClaims()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(sub, out var userId) ? userId : null;
    }
}

public record RegisterRequest(string Email, string Password, string FullName);

public record LoginRequest(string Email, string Password);
