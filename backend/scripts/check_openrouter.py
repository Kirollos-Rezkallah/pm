import asyncio

from app.openrouter import OpenRouterClient


async def main() -> None:
    answer = await OpenRouterClient().check_connection()
    if "4" not in answer:
        raise RuntimeError("OpenRouter did not return the expected answer for 2 + 2.")
    print(answer)


if __name__ == "__main__":
    asyncio.run(main())
