from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str | None = None
    gemini_api_keys: str | None = None
    sarvam_api_key: str | None = None
    database_url: str = "sqlite:///./prompt_engine.db"
    frontend_origin: str = "http://localhost:5173"

    # Optional: comma-separated list of allowed origins for production
    # e.g. CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173
    cors_origins: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def allowed_origins(self) -> list[str]:
        """Return all CORS-allowed origins, deduped."""
        origins: list[str] = [self.frontend_origin]
        if self.cors_origins:
            extras = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
            origins.extend(extras)
        # Always allow localhost variants in development
        origins.extend(["http://localhost:5173", "http://localhost:5174"])
        return list(dict.fromkeys(origins))  # dedupe preserving order

    @property
    def gemini_keys(self) -> list[str]:
        """Return ordered, de-duplicated Gemini keys from env.

        Supports:
        - GEMINI_API_KEYS=key1,key2,key3
        - GEMINI_API_KEY=single_key (backward-compatible)
        """
        keys: list[str] = []

        if self.gemini_api_keys:
            split_keys = self.gemini_api_keys.replace("\n", ",").split(",")
            keys.extend([k.strip() for k in split_keys if k.strip()])

        if self.gemini_api_key and self.gemini_api_key.strip():
            keys.append(self.gemini_api_key.strip())

        # Preserve order while removing duplicates
        seen: set[str] = set()
        deduped: list[str] = []
        for key in keys:
            if key not in seen:
                seen.add(key)
                deduped.append(key)

        return deduped


settings = Settings()
