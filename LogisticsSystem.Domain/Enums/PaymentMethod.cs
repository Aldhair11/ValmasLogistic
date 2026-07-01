namespace LogisticsSystem.Domain.Enums;

public enum PaymentMethod
{
    /// <summary>El cliente paga al momento de registrar el envío.</summary>
    PrePaid = 0,

    /// <summary>El cliente paga al recibir el paquete (cobro contra entrega).</summary>
    CashOnDelivery = 1,
}
