use soroban_sdk::contracterror;

/// Errors returned by the oracle contract.
///
/// Each variant carries a stable numeric code (the discriminant) that is
/// encoded on-chain and surfaced to clients. Do **not** renumber existing
/// variants — doing so is a breaking change for any client that inspects the
/// raw error code.
///
/// # Error code table
///
/// | Code | Variant            | Meaning                                                  |
/// |------|--------------------|----------------------------------------------------------|
/// |  1   | Unauthorized       | Caller is not the registered admin                       |
/// |  2   | AlreadySubmitted   | A result has already been recorded for this match_id     |
/// |  3   | ResultNotFound     | No result has been submitted for the given match_id      |
/// |  4   | AlreadyInitialized | Contract has already been initialized                    |
/// |  5   | InvalidGameId      | game_id is empty or exceeds the 64-byte maximum          |
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    /// [E001] Caller is not the registered admin (the trusted off-chain oracle service).
    Unauthorized = 1,

    /// [E002] A result has already been recorded for this `match_id`.
    /// Results are immutable once submitted to prevent tampering.
    AlreadySubmitted = 2,

    /// [E003] No result has been submitted for the given `match_id` yet.
    ResultNotFound = 3,

    /// [E004] `initialize` has already been called; the contract cannot be re-initialized.
    AlreadyInitialized = 4,

    /// [E005] `game_id` is empty or exceeds the 64-byte maximum length.
    InvalidGameId = 5,
}

impl core::fmt::Display for Error {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            Error::Unauthorized =>
                write!(f, "[E001] Unauthorized: caller is not the registered oracle admin"),
            Error::AlreadySubmitted =>
                write!(f, "[E002] AlreadySubmitted: a result has already been recorded for this match_id"),
            Error::ResultNotFound =>
                write!(f, "[E003] ResultNotFound: no result has been submitted for this match_id"),
            Error::AlreadyInitialized =>
                write!(f, "[E004] AlreadyInitialized: contract has already been initialized"),
            Error::InvalidGameId =>
                write!(f, "[E005] InvalidGameId: game_id is empty or exceeds the 64-byte limit"),
        }
    }
}
