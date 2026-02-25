import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";

// Mock toast
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock marketplaceRequest
const mockRequest = vi.fn();
vi.mock("@/hooks/marketplace/api", () => ({
  marketplaceRequest: (...args: any[]) => mockRequest(...args),
}));

import { useMarketplaceOrders } from "@/hooks/marketplace/useMarketplaceOrders";

describe("useMarketplaceOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createOrder sends request and shows toast on success", async () => {
    const orderData = { order_code: "MKT-001" };
    mockRequest.mockResolvedValue({ order: orderData });

    const { result } = renderHook(() => useMarketplaceOrders("12345678901"));

    let order: any;
    await act(async () => {
      order = await result.current.createOrder({
        listing_id: "listing-1",
        buyer_name: "Test",
      });
    });

    expect(order).toEqual(orderData);
    expect(mockRequest).toHaveBeenCalledWith(
      "12345678901", "create-order", "POST",
      expect.objectContaining({ listing_id: "listing-1" })
    );
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Pedido criado!" })
    );
  });

  it("createOrder shows error toast on failure", async () => {
    mockRequest.mockRejectedValue(new Error("Sem estoque"));

    const { result } = renderHook(() => useMarketplaceOrders("12345678901"));

    let order: any;
    await act(async () => {
      order = await result.current.createOrder({
        listing_id: "listing-1",
        buyer_name: "Test",
      });
    });

    expect(order).toBeNull();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" })
    );
  });

  it("createOrder returns null when no CPF", async () => {
    const { result } = renderHook(() => useMarketplaceOrders(null));

    let order: any;
    await act(async () => {
      order = await result.current.createOrder({
        listing_id: "listing-1",
        buyer_name: "Test",
      });
    });

    expect(order).toBeNull();
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("confirmPayment returns true on success", async () => {
    mockRequest.mockResolvedValue({});

    const { result } = renderHook(() => useMarketplaceOrders("12345678901"));

    let success: boolean = false;
    await act(async () => {
      success = await result.current.confirmPayment("order-1", "pix", "pay-123");
    });

    expect(success).toBe(true);
    expect(mockRequest).toHaveBeenCalledWith(
      "12345678901", "confirm-payment", "PUT",
      expect.objectContaining({ order_id: "order-1", payment_method: "pix" })
    );
  });

  it("fetchMyOrders populates myOrders state", async () => {
    const orders = [{ id: "1", order_code: "MKT-001" }];
    mockRequest.mockResolvedValue({ orders });

    const { result } = renderHook(() => useMarketplaceOrders("12345678901"));

    await act(async () => {
      await result.current.fetchMyOrders();
    });

    expect(result.current.myOrders).toEqual(orders);
  });

  it("fetchMySales populates mySales state", async () => {
    const sales = [{ id: "2", order_code: "MKT-002" }];
    mockRequest.mockResolvedValue({ orders: sales });

    const { result } = renderHook(() => useMarketplaceOrders("12345678901"));

    await act(async () => {
      await result.current.fetchMySales();
    });

    expect(result.current.mySales).toEqual(sales);
  });

  it("updateOrderStatus returns true on success", async () => {
    mockRequest.mockResolvedValue({});

    const { result } = renderHook(() => useMarketplaceOrders("12345678901"));

    let success = false;
    await act(async () => {
      success = await result.current.updateOrderStatus("order-1", "shipped");
    });

    expect(success).toBe(true);
  });

  it("rateSeller returns true on success", async () => {
    mockRequest.mockResolvedValue({});

    const { result } = renderHook(() => useMarketplaceOrders("12345678901"));

    let success = false;
    await act(async () => {
      success = await result.current.rateSeller("order-1", 5, "Excelente!");
    });

    expect(success).toBe(true);
    expect(mockRequest).toHaveBeenCalledWith(
      "12345678901", "rate-seller", "POST",
      expect.objectContaining({ rating: 5, review: "Excelente!" })
    );
  });
});
