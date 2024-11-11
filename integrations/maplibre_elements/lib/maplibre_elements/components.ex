defmodule FireWebc.Components.MapLibre do
  @moduledoc """
  `Phoenix.Component` which makes a `ml-map` web component compatible
  with `Phoenix.LiveView`.
  """
  use Phoenix.Component

  @doc """
  A functional component which constructs a `ml-map` compatible with
  `Phoenix.LiveView`
  """
  attr :style, :string,
    required: true,
    doc: """
      Specifies the `style` to pass to `MapLibre.Map`.
    """

  attr :id, :string,
    required: true,
    doc: """
    The ID to use for the MapLibre JS container. Required for `phx-update`.
    """

  attr :center, :any
  attr :zoom, :float, default: nil

  slot :inner_block,
    doc: """
      Elements to add inside the `ml-map` container.
    """

  def map(assigns) do
    assigns =
      assigns
      |> case do
        %{ center: %{long: long, lat: lat}} = assigns ->
          assign(assigns, center_long: long, center_lat: lat)
        %{ center: {long, lat}} = assigns ->
          assign(assigns, center_long: long, center_lat: lat)
        assigns -> assign(assigns, center_long: nil, center_lat: nil)
      end

    ~H"""
    <ml-map
      data-style={@style}
      map-id={@id}
      data-center-long={@center_long}
      data-center-lat={@center_lat}
      data-zoom={@zoom}
    >
      <%= render_slot(@inner_block) %>
      <%!-- BUG: sometimes two of these get created --%>
      <ml-map-container phx-update="ignore" id={@id}></ml-map-container>
    </ml-map>
    """
  end

  @doc """
  A function component which constructs a `ml-marker`.
  """
  attr :latitude, :float,
    required: true,
    doc: """
      The latitude to render the marker at.
    """

  attr :longitude, :float,
    required: true,
    doc: """
      The longitude to render the marker at.
    """

  attr :html, :global

  slot :element,
    required: false,
    doc: """
    The HTML Element to use as the marker icon
    """

  def marker(assigns) do
    ~H"""
    <ml-marker {@html} data-lat={@latitude} data-long={@longitude}>
      <%= render_slot(@element) %>
      <%!--
        TODO: add styling via html
      <%= render_slot(@style) %> --%>
    </ml-marker>
    """
  end

  attr :id, :string,
    required: true,
    doc: """
    The source id
    """

  attr :type, :string,
    required: true,
    doc: """
    """

  slot :inner_block

  def source(assigns) do
    ~H"""
    <ml-source id={@id} data-type={@type}>
      <%= render_slot(@inner_block) %>
    </ml-source>
    """
  end

  attr :id, :string,
    required: true,
    doc: """
    The source id
    """

  attr :type, :string,
    required: true,
    doc: """
    """

  attr :source, :string,
    required: true,
    doc: """
    """

  def layer(assigns) do
    ~H"""
    <ml-layer id={@id} data-type={@type} data-source={@source}></ml-layer>
    """
  end
end
