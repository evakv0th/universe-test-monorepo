/* eslint-disable @typescript-eslint/unbound-method */
import { EventMessage } from "@app/constants";
import { NatsService } from "./nats.service";

jest.mock("nats", () => {
  const jsMock = {
    publish: jest.fn(),
  };
  const jsmMock = {
    streams: {
      add: jest.fn(),
    },
  };
  return {
    connect: jest.fn().mockResolvedValue({
      isClosed: jest.fn().mockReturnValue(false),
      jetstream: jest.fn(() => jsMock),
      jetstreamManager: jest.fn(() => jsmMock),
      drain: jest.fn(),
      close: jest.fn(),
    }),
    StringCodec: jest.fn(() => ({
      encode: jest.fn((v) => v),
      decode: jest.fn((v) => v),
    })),
    JSONCodec: jest.fn(() => ({
      encode: jest.fn((v) => v),
      decode: jest.fn((v) => v),
    })),
  };
});

describe("NatsService", () => {
  let service: NatsService;

  beforeEach(() => {
    service = new NatsService();
    jest.spyOn(service["logger"], "log").mockImplementation(() => {});
    jest.spyOn(service["logger"], "error").mockImplementation(() => {});
    jest.spyOn(service["logger"], "warn").mockImplementation(() => {});
  });

  it("should connect and initialize JetStream and JetStreamManager", async () => {
    await service.connect();
    expect(service.isConnected()).toBe(true);
    expect(service.getJetStream()).toBeDefined();
    expect(service.getStringCodec()).toBeDefined();
    expect(service.getJsonCodec()).toBeDefined();
  });

  it("should not reconnect if already connected", async () => {
    await service.connect();
    await service.connect();
    expect(service["logger"].log).toHaveBeenCalledWith(
      "NATS connection already established.",
    );
  });

  it("should publish JSON message", async () => {
    await service.connect();
    service["js"] = {
      publish: jest.fn(),
    } as any;
    service["jsc"] = { encode: jest.fn((v) => v) } as any;
    const data = { foo: "bar" } as unknown as EventMessage;
    await service.publishJson("test", data);
    expect(service["js"].publish).toHaveBeenCalledWith("test", data);
  });

  it("should throw if publishJson is called before connect", async () => {
    (service as any)["js"] = undefined;
    await expect(
      service.publishJson("test", {} as EventMessage),
    ).rejects.toThrow("NATS JetStream not connected.");
  });

  it("should handle publish errors", async () => {
    await service.connect();
    service["js"] = {
      publish: jest.fn().mockRejectedValue(new Error("fail")),
    } as any;
    service["jsc"] = { encode: jest.fn((v) => v) } as any;
    await expect(
      service.publishJson("test", {} as EventMessage),
    ).rejects.toThrow("fail");
  });

  it("should drain and close connection on destroy", async () => {
    await service.connect();
    const nc = service["nc"];
    await service.onModuleDestroy();
    expect(nc.drain).toHaveBeenCalled();
    expect(nc.close).toHaveBeenCalled();
    expect(service["logger"].log).toHaveBeenCalledWith(
      "Draining NATS connection...",
    );
    expect(service["logger"].log).toHaveBeenCalledWith(
      "NATS connection drained and closed.",
    );
  });

  it("should warn and call onModuleDestroy on shutdown", async () => {
    const spy = jest.spyOn(service, "onModuleDestroy").mockResolvedValue();
    await service.onApplicationShutdown("SIGTERM");
    expect(service["logger"].warn).toHaveBeenCalledWith(
      "Application shutdown due to signal: SIGTERM",
    );
    expect(spy).toHaveBeenCalled();
  });
});
