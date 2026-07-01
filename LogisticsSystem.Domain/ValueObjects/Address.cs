namespace LogisticsSystem.Domain.ValueObjects;

public sealed record Address(string Street, string City, string State, string ZipCode)
{
    public string Street { get; init; } = ValidateRequired(Street, nameof(Street));
    public string City { get; init; } = ValidateRequired(City, nameof(City));
    public string State { get; init; } = ValidateRequired(State, nameof(State));
    public string ZipCode { get; init; } = ValidateRequired(ZipCode, nameof(ZipCode));

    private static string ValidateRequired(string value, string fieldName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value, fieldName);
        return value;
    }
}
