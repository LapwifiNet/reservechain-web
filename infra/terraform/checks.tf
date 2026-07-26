# Non-blocking assertions evaluated at plan and apply. They do not run during
# `terraform validate`, so they complement the variable validations rather than
# replacing them: anything that can be checked from a variable alone belongs in
# a `validation` block, and only cross-cutting facts belong here.

check "workspace_matches_environment" {
  assert {
    condition = local.workspace_matches_environment
    error_message = format(
      "Workspace %q does not match environment %q. One workspace per environment: select the matching workspace, or pass -var environment=%s.",
      terraform.workspace, var.environment, terraform.workspace
    )
  }
}

check "signing_keys_are_distinct" {
  assert {
    condition = (
      var.jwt_secret != var.investor_jwt_secret &&
      var.jwt_secret != var.payload_secret &&
      var.investor_jwt_secret != var.payload_secret
    )
    error_message = "jwt_secret, investor_jwt_secret and payload_secret must all differ. The API refuses to start when INVESTOR_JWT_SECRET equals JWT_SECRET, and the CMS refuses when PAYLOAD_SECRET equals either (invariants 19 and 24). A cross-variable rule cannot live in a variable validation block, so it is asserted here."
  }
}

check "gated_modules_ship_disabled" {
  assert {
    condition = alltrue([
      for e in local.services.api.environment :
      e.value == "false" if contains([
        "PROOF_OF_RESERVES_ENABLED",
        "REDEMPTION_ENABLED",
        "WALLET_ENABLED",
        "PURCHASE_ENABLED",
        "CHAIN_SYNC_ENABLED",
      ], e.name)
    ])
    error_message = "Every gated-module flag in the api task definition must be \"false\". Infrastructure is a new place for a flag to be turned on by accident (AGENTS §2)."
  }
}
